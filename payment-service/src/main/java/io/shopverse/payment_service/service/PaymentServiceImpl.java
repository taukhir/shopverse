package io.shopverse.payment_service.service;

import io.shopverse.payment_service.config.PaymentProperties;
import io.shopverse.payment_service.dto.PaymentResponse;
import io.shopverse.payment_service.entity.PaymentEntity;
import io.shopverse.payment_service.exception.InvalidPaymentStateException;
import io.shopverse.payment_service.exception.ResourceNotFoundException;
import io.shopverse.payment_service.repository.PaymentRepository;
import io.shopverse.payment_service.config.KafkaTopicsProperties;
import io.shopverse.payment_service.outbox.OutboxService;
import io.shopverse.payment_service.saga.PaymentCompletedEvent;
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
        if (payment.getStatus() == io.shopverse.payment_service.entity.PaymentStatus.TIMED_OUT) {
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
        if (payment.getStatus() != io.shopverse.payment_service.entity.PaymentStatus.CAPTURED) {
            throw new InvalidPaymentStateException("Only captured payments can be refunded");
        }
        payment.refund();
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
}
