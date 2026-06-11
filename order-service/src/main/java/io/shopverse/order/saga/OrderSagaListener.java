package io.shopverse.order.saga;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.shopverse.order.observability.CorrelationContext;
import io.shopverse.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.annotation.RetryableTopic;
import org.springframework.kafka.annotation.DltHandler;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import io.shopverse.order.recovery.FailedKafkaEventService;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderSagaListener {

    private final ObjectMapper objectMapper;
    private final OrderService orderService;
    private final FailedKafkaEventService failedKafkaEventService;

    @RetryableTopic(attempts = "3")
    @KafkaListener(
            topics = "${shopverse.kafka.topics.inventory-reserved}",
            groupId = "${spring.application.name}"
    )
    public void onInventoryReserved(String payload) {
        InventoryReservedEvent event = readEvent(payload, InventoryReservedEvent.class);
        CorrelationContext.run(event.correlationId(), () -> {
            orderService.markInventoryReservedAndPaymentProcessing(event.orderNumber());
        });
    }

    @RetryableTopic(attempts = "3")
    @KafkaListener(
            topics = "${shopverse.kafka.topics.inventory-failed}",
            groupId = "${spring.application.name}"
    )
    public void onInventoryFailed(String payload) {
        InventoryFailedEvent event = readEvent(payload, InventoryFailedEvent.class);
        CorrelationContext.run(event.correlationId(), () -> handleInventoryFailed(event));
    }

    private void handleInventoryFailed(InventoryFailedEvent event) {
        orderService.markInventoryRejected(event.orderNumber(), event.reason());
        log.warn(
                "Choreography saga cancelled orderNumber={} correlationId={} reason={} nextAction=MARK_ORDER_REJECTED",
                event.orderNumber(),
                event.correlationId(),
                event.reason()
        );
    }

    @RetryableTopic(attempts = "3")
    @KafkaListener(
            topics = "${shopverse.kafka.topics.payment-completed}",
            groupId = "${spring.application.name}"
    )
    public void onPaymentCompleted(String payload) {
        PaymentCompletedEvent event = readEvent(payload, PaymentCompletedEvent.class);
        CorrelationContext.run(event.correlationId(), () -> handlePaymentCompleted(event));
    }

    private void handlePaymentCompleted(PaymentCompletedEvent event) {
        orderService.confirm(event.orderNumber(), event.paymentReference());
        log.info(
                "Choreography saga completed orderNumber={} correlationId={} paymentReference={} amount={} nextAction=MARK_ORDER_CONFIRMED",
                event.orderNumber(),
                event.correlationId(),
                event.paymentReference(),
                event.amount()
        );
    }

    @RetryableTopic(attempts = "3")
    @KafkaListener(
            topics = "${shopverse.kafka.topics.payment-failed}",
            groupId = "${spring.application.name}"
    )
    public void onPaymentFailed(String payload) {
        PaymentFailedEvent event = readEvent(payload, PaymentFailedEvent.class);
        CorrelationContext.run(event.correlationId(), () -> handlePaymentFailed(event));
    }

    private void handlePaymentFailed(PaymentFailedEvent event) {
        orderService.markPaymentFailed(event.orderNumber(), event.reason());
        log.warn(
                "Choreography saga cancelled orderNumber={} correlationId={} reason={} nextAction=MARK_ORDER_PAYMENT_FAILED",
                event.orderNumber(),
                event.correlationId(),
                event.reason()
        );
    }

    private <T> T readEvent(String payload, Class<T> eventType) {
        try {
            return objectMapper.readValue(payload, eventType);
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("Invalid Kafka event payload for " + eventType.getSimpleName(), exception);
        }
    }

    @DltHandler
    public void onDeadLetter(ConsumerRecord<String, String> record) {
        String sourceTopic = record.topic().replaceFirst("-dlt$", "");
        failedKafkaEventService.record(
                sourceTopic,
                record.value(),
                "Order listener failed after retry policy",
                3
        );
        log.error("Order event moved to DLT sourceTopic={} payload={}", sourceTopic, record.value());
    }
}
