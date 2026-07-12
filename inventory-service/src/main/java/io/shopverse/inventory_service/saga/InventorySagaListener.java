package io.shopverse.inventory_service.saga;

import io.shopverse.platform.kafka.KafkaEventParser;
import io.shopverse.platform.observability.CorrelationContext;
import io.shopverse.inventory_service.recovery.FailedKafkaEventService;
import io.shopverse.inventory_service.service.InventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.DltHandler;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.annotation.RetryableTopic;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class InventorySagaListener {

    private final KafkaEventParser eventParser;
    private final InventorySagaTransactionService sagaTransactionService;
    private final InventoryService inventoryService;
    private final FailedKafkaEventService failedKafkaEventService;

    @RetryableTopic(attempts = "3")
    @KafkaListener(
            topics = "${shopverse.kafka.topics.order-created}",
            groupId = "${spring.application.name}"
    )
    public void onOrderCreated(String payload) {
        OrderCreatedEvent event = eventParser.parse(payload, OrderCreatedEvent.class);
        CorrelationContext.run(event.correlationId(), () -> handleOrderCreated(event));
    }

    @RetryableTopic(attempts = "3")
    @KafkaListener(
            topics = "${shopverse.kafka.topics.payment-failed}",
            groupId = "${spring.application.name}"
    )
    public void onPaymentFailed(String payload) {
        PaymentFailedEvent event = eventParser.parse(payload, PaymentFailedEvent.class);
        CorrelationContext.run(event.correlationId(), () -> handlePaymentFailed(event));
    }

    @RetryableTopic(attempts = "3")
    @KafkaListener(
            topics = "${shopverse.kafka.topics.order-cancelled}",
            groupId = "${spring.application.name}"
    )
    public void onOrderCancelled(String payload) {
        OrderCancelledEvent event = eventParser.parse(payload, OrderCancelledEvent.class);
        CorrelationContext.run(event.correlationId(), () -> handleOrderCancelled(event));
    }

    private void handleOrderCreated(OrderCreatedEvent event) {
        log.info(
                "Choreography saga inventory step started orderNumber={} correlationId={} productId={} quantity={}",
                event.orderNumber(),
                event.correlationId(),
                event.productId(),
                event.quantity()
        );
        sagaTransactionService.handleOrderCreated(event);
    }

    private void handlePaymentFailed(PaymentFailedEvent event) {
        inventoryService.release(event.orderNumber());
        log.warn(
                "Choreography saga compensation released inventory orderNumber={} correlationId={} reason={}",
                event.orderNumber(),
                event.correlationId(),
                event.reason()
        );
    }

    private void handleOrderCancelled(OrderCancelledEvent event) {
        inventoryService.release(event.orderNumber());
        log.warn(
                "Released inventory after order cancellation orderNumber={} correlationId={} reason={}",
                event.orderNumber(),
                event.correlationId(),
                event.reason()
        );
    }

    @DltHandler
    public void onDeadLetter(ConsumerRecord<String, String> record) {
        String sourceTopic = record.topic().replaceFirst("-dlt$", "");
        failedKafkaEventService.record(
                sourceTopic,
                record.value(),
                "Inventory listener failed after retry policy",
                3
        );
        log.error("Inventory event moved to DLT sourceTopic={} payload={}", sourceTopic, record.value());
    }
}
