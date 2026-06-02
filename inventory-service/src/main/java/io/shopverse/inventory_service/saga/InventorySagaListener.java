package io.shopverse.inventory_service.saga;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class InventorySagaListener {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Value("${shopverse.kafka.topics.inventory-reserved}")
    private String inventoryReservedTopic;

    @Value("${shopverse.kafka.topics.inventory-failed}")
    private String inventoryFailedTopic;

    @KafkaListener(
            topics = "${shopverse.kafka.topics.order-created}",
            groupId = "${spring.application.name}"
    )
    public void onOrderCreated(String payload) {
        try {
            OrderCreatedEvent event = objectMapper.readValue(payload, OrderCreatedEvent.class);
            log.info(
                    "Choreography saga inventory step started orderNumber={} productId={} quantity={}",
                    event.orderNumber(),
                    event.productId(),
                    event.quantity()
            );

            if (event.productId() == 103L || event.quantity() > 5) {
                publishInventoryFailed(event, "Inventory not available for product " + event.productId());
                return;
            }

            InventoryReservedEvent reservedEvent = new InventoryReservedEvent(
                    event.orderId(),
                    event.orderNumber(),
                    event.productId(),
                    event.quantity(),
                    event.amount()
            );
            String reservedPayload = objectMapper.writeValueAsString(reservedEvent);
            kafkaTemplate.send(inventoryReservedTopic, event.orderNumber(), reservedPayload);
            log.info(
                    "Choreography saga inventory reserved orderNumber={} topic={} payload={}",
                    event.orderNumber(),
                    inventoryReservedTopic,
                    reservedPayload
            );
        } catch (Exception exception) {
            log.error("Unable to process order.created event payload={}", payload, exception);
        }
    }

    @KafkaListener(
            topics = "${shopverse.kafka.topics.payment-failed}",
            groupId = "${spring.application.name}"
    )
    public void onPaymentFailed(String payload) {
        try {
            PaymentFailedEvent event = objectMapper.readValue(payload, PaymentFailedEvent.class);
            log.warn(
                    "Choreography saga compensation released inventory orderNumber={} reason={}",
                    event.orderNumber(),
                    event.reason()
            );
        } catch (Exception exception) {
            log.error("Unable to process payment.failed compensation event payload={}", payload, exception);
        }
    }

    private void publishInventoryFailed(OrderCreatedEvent event, String reason) throws Exception {
        InventoryFailedEvent failedEvent = new InventoryFailedEvent(event.orderId(), event.orderNumber(), reason);
        String failedPayload = objectMapper.writeValueAsString(failedEvent);
        kafkaTemplate.send(inventoryFailedTopic, event.orderNumber(), failedPayload);
        log.warn(
                "Choreography saga inventory failed orderNumber={} topic={} reason={}",
                event.orderNumber(),
                inventoryFailedTopic,
                reason
        );
    }
}
