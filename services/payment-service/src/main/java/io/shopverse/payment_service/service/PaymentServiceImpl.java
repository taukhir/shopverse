package io.shopverse.payment_service.service;

import io.shopverse.payment_service.config.PaymentProperties;
import io.shopverse.payment_service.dto.PaymentResponse;
import io.shopverse.payment_service.dto.PaymentWebhookRequest;
import io.shopverse.payment_service.entity.PaymentEntity;
import io.shopverse.payment_service.entity.PaymentStatus;
import io.shopverse.payment_service.exception.InvalidPaymentStateException;
import io.shopverse.payment_service.exception.ResourceNotFoundException;
import io.shopverse.payment_service.repository.PaymentRepository;
import io.shopverse.payment_service.config.KafkaTopicsProperties;
import io.shopverse.payment_service.outbox.OutboxService;
import io.shopverse.payment_service.saga.PaymentCompletedEvent;
import io.shopverse.payment_service.saga.PaymentFailedEvent;
import io.shopverse.payment_service.provider.PaymentProvider;
import io.shopverse.payment_service.provider.PaymentSimulationMode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import io.micrometer.core.instrument.MeterRegistry;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository repository;
    private final PaymentProperties paymentProperties;
    private final PaymentProvider paymentProvider;
    private final MeterRegistry meterRegistry;
    private final OutboxService outboxService;
    private final KafkaTopicsProperties topics;

    @Override
    @Transactional
    @CacheEvict(cacheNames = "payments", allEntries = true)
    public PaymentEntity process(
            String orderNumber,
            String correlationId,
            String customerUsername,
            BigDecimal amount
    ) {
        return repository.findByOrderNumber(orderNumber).orElseGet(() -> {
            PaymentEntity payment = new PaymentEntity(orderNumber, correlationId, customerUsername, amount);
            if (amount.compareTo(paymentProperties.approvalLimit()) > 0) {
                payment.decline("Payment approval limit exceeded");
            } else {
                var providerResult = paymentProvider.authorize(orderNumber, amount);
                if (providerResult.outcome() == PaymentSimulationMode.SUCCESS) {
                    payment.authorize(providerResult.reference());
                    payment.capture();
                } else if (providerResult.outcome() == PaymentSimulationMode.DECLINE) {
                    payment.decline(providerResult.reason());
                } else {
                    payment.timeOut(providerResult.reason());
                }
            }
            PaymentEntity saved = repository.save(payment);
            meterRegistry.counter(
                    "shopverse.payment.outcomes",
                    "status", saved.getStatus().name()
            ).increment();
            log.atInfo().addKeyValue("orderNumber", orderNumber)
                    .addKeyValue("correlationId", correlationId)
                    .addKeyValue("paymentStatus", saved.getStatus())
                    .log("Payment processed");
            return saved;
        });
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = "payments", allEntries = true)
    public PaymentResponse createIntent(String orderNumber, String correlationId, String customerUsername, BigDecimal amount) {
        PaymentEntity payment = repository.findByOrderNumber(orderNumber).orElseGet(() ->
                repository.save(new PaymentEntity(orderNumber, correlationId, customerUsername, amount))
        );
        return toResponse(payment);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = "payments", allEntries = true)
    public PaymentResponse retry(String orderNumber) {
        PaymentEntity payment = findPayment(orderNumber);
        if (payment.getStatus() != PaymentStatus.DECLINED && payment.getStatus() != PaymentStatus.TIMED_OUT) {
            throw new InvalidPaymentStateException("Only declined or timed-out payments can be retried");
        }
        payment.markPending();
        applyProviderOutcome(payment);
        enqueueOutcomeIfTerminal(payment);
        return toResponse(payment);
    }

    @Override
    @Cacheable(cacheNames = "payments", key = "#orderNumber")
    public PaymentResponse getByOrderNumber(String orderNumber) {
        return toResponse(repository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + orderNumber)));
    }

    @Override
    public List<PaymentResponse> getAll() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = "payments", allEntries = true)
    public PaymentResponse reconcile(String orderNumber) {
        PaymentEntity payment = findPayment(orderNumber);
        if (payment.getStatus() == PaymentStatus.TIMED_OUT) {
            payment.authorize("RECONCILED-" + orderNumber);
            payment.capture();
            outboxService.enqueue(
                    "PAYMENT",
                    payment.getOrderNumber(),
                    PaymentCompletedEvent.class.getSimpleName(),
                    topics.paymentCompleted(),
                    payment.getOrderNumber(),
                    new PaymentCompletedEvent(
                            null,
                            payment.getOrderNumber(),
                            payment.getCorrelationId(),
                            payment.getPaymentReference(),
                            payment.getAmount()
                    ),
                    payment.getCorrelationId()
            );
        }
        return toResponse(payment);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = "payments", allEntries = true)
    public PaymentResponse refund(String orderNumber) {
        PaymentEntity payment = findPayment(orderNumber);
        if (payment.getStatus() != PaymentStatus.CAPTURED) {
            throw new InvalidPaymentStateException("Only captured payments can be refunded");
        }
        payment.refund();
        return toResponse(payment);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = "payments", allEntries = true)
    public PaymentResponse applyWebhook(PaymentWebhookRequest request) {
        PaymentEntity payment = findPayment(request.orderNumber());
        switch (request.status()) {
            case AUTHORIZED -> payment.authorize(referenceOrDefault(request.paymentReference(), "WEBHOOK-AUTH-" + request.orderNumber()));
            case CAPTURED -> {
                if (payment.getPaymentReference() == null) {
                    payment.authorize(referenceOrDefault(request.paymentReference(), "WEBHOOK-PAY-" + request.orderNumber()));
                }
                payment.capture();
            }
            case DECLINED -> payment.decline(reasonOrDefault(request.reason(), "Provider webhook declined the payment"));
            case TIMED_OUT -> payment.timeOut(reasonOrDefault(request.reason(), "Provider webhook timed out the payment"));
            case REFUNDED -> {
                if (payment.getStatus() != PaymentStatus.CAPTURED) {
                    throw new InvalidPaymentStateException("Only captured payments can be marked refunded");
                }
                payment.refund();
            }
            case PENDING -> payment.markPending();
        }
        enqueueOutcomeIfTerminal(payment);
        return toResponse(payment);
    }

    private PaymentEntity findPayment(String orderNumber) {
        return repository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + orderNumber));
    }

    private PaymentResponse toResponse(PaymentEntity payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getOrderNumber(),
                payment.getCorrelationId(),
                payment.getAmount(),
                payment.getStatus().name(),
                payment.getPaymentReference(),
                payment.getFailureReason(),
                payment.getCreatedAt(),
                payment.getUpdatedAt()
        );
    }

    private void applyProviderOutcome(PaymentEntity payment) {
        if (payment.getAmount().compareTo(paymentProperties.approvalLimit()) > 0) {
            payment.decline("Payment approval limit exceeded");
            return;
        }
        var providerResult = paymentProvider.authorize(payment.getOrderNumber(), payment.getAmount());
        if (providerResult.outcome() == PaymentSimulationMode.SUCCESS) {
            payment.authorize(providerResult.reference());
            payment.capture();
        } else if (providerResult.outcome() == PaymentSimulationMode.DECLINE) {
            payment.decline(providerResult.reason());
        } else {
            payment.timeOut(providerResult.reason());
        }
        meterRegistry.counter(
                "shopverse.payment.outcomes",
                "status", payment.getStatus().name()
        ).increment();
    }

    private void enqueueOutcomeIfTerminal(PaymentEntity payment) {
        if (payment.getStatus() == PaymentStatus.CAPTURED) {
            outboxService.enqueue(
                    "PAYMENT",
                    payment.getOrderNumber(),
                    PaymentCompletedEvent.class.getSimpleName(),
                    topics.paymentCompleted(),
                    payment.getOrderNumber(),
                    new PaymentCompletedEvent(
                            null,
                            payment.getOrderNumber(),
                            payment.getCorrelationId(),
                            payment.getPaymentReference(),
                            payment.getAmount()
                    ),
                    payment.getCorrelationId()
            );
        } else if (payment.getStatus() == PaymentStatus.DECLINED) {
            outboxService.enqueue(
                    "PAYMENT",
                    payment.getOrderNumber(),
                    PaymentFailedEvent.class.getSimpleName(),
                    topics.paymentFailed(),
                    payment.getOrderNumber(),
                    new PaymentFailedEvent(
                            null,
                            payment.getOrderNumber(),
                            payment.getCorrelationId(),
                            payment.getFailureReason()
                    ),
                    payment.getCorrelationId()
            );
        }
    }

    private String referenceOrDefault(String reference, String fallback) {
        return reference == null || reference.isBlank() ? fallback : reference.trim();
    }

    private String reasonOrDefault(String reason, String fallback) {
        return reason == null || reason.isBlank() ? fallback : reason.trim();
    }
}
