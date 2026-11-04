package io.shopverse.payment_service.saga;

import io.shopverse.payment_service.config.KafkaTopicsProperties;
import io.shopverse.payment_service.entity.PaymentEntity;
import io.shopverse.payment_service.entity.PaymentStatus;
import io.shopverse.payment_service.outbox.OutboxService;
import io.shopverse.payment_service.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentSagaTransactionService {
    private final PaymentService paymentService;
    private final OutboxService outboxService;
    private final KafkaTopicsProperties topics;

    @Transactional
    public void handleInventoryReserved(InventoryReservedEvent event) {
        PaymentEntity payment = paymentService.process(
                event.orderNumber(), event.correlationId(), event.customerUsername(), event.amount());
        if (payment.getStatus() == PaymentStatus.DECLINED) {
            enqueue(event, new PaymentFailedEvent(
                    event.orderId(), event.orderNumber(), event.correlationId(), payment.getFailureReason()),
                    topics.paymentFailed());
        } else if (payment.getStatus() == PaymentStatus.CAPTURED) {
            enqueue(event, new PaymentCompletedEvent(
                    event.orderId(), event.orderNumber(), event.correlationId(),
                    payment.getPaymentReference(), event.amount()), topics.paymentCompleted());
        } else if (payment.getStatus() == PaymentStatus.TIMED_OUT) {
            log.warn("Payment outcome is uncertain; waiting for reconciliation orderNumber={} correlationId={}",
                    event.orderNumber(), event.correlationId());
        }
    }

    private void enqueue(InventoryReservedEvent source, Object event, String topic) {
        outboxService.enqueue("PAYMENT", source.orderNumber(), event.getClass().getSimpleName(),
                topic, source.orderNumber(), event, source.correlationId());
    }
}
