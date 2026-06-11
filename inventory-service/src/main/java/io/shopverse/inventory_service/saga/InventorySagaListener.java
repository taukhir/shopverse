package io.shopverse.inventory_service.saga;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.shopverse.inventory_service.observability.CorrelationContext;
import io.shopverse.inventory_service.service.InventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class InventorySagaListener {

    private final ObjectMapper objectMapper;
    private final InventorySagaPublisher publisher;
    private final InventoryService inventoryService;

    @KafkaListener(
            topics = "${shopverse.kafka.topics.order-created}",
            groupId = "${spring.application.name}"
    )
    public void onOrderCreated(String payload) {
        OrderCreatedEvent event = readEvent(payload, OrderCreatedEvent.class);
        CorrelationContext.run(event.correlationId(), () -> handleOrderCreated(event));
    }

    private void handleOrderCreated(OrderCreatedEvent event) {
        log.info(
                "Choreography saga inventory step started orderNumber={} correlationId={} productId={} quantity={}",
                event.orderNumber(),
                event.correlationId(),
                event.productId(),
                event.quantity()
        );

        if (!inventoryService.reserve(
                event.orderNumber(),
                event.correlationId(),
                event.productId(),
                event.quantity()
        )) {
            publisher.publishFailed(new InventoryFailedEvent(
                    event.orderId(),
                    event.orderNumber(),
                    event.correlationId(),
                    "Inventory not available for product " + event.productId()
            ));
            return;
        }

        publisher.publishReserved(new InventoryReservedEvent(
                event.orderId(),
                event.orderNumber(),
                event.correlationId(),
                event.productId(),
                event.quantity(),
                event.amount()
        ));
    }

    @KafkaListener(
            topics = "${shopverse.kafka.topics.payment-failed}",
            groupId = "${spring.application.name}"
    )
    public void onPaymentFailed(String payload) {
        PaymentFailedEvent event = readEvent(payload, PaymentFailedEvent.class);
        CorrelationContext.run(event.correlationId(), () -> handlePaymentFailed(event));
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

    private <T> T readEvent(String payload, Class<T> eventType) {
        try {
            return objectMapper.readValue(payload, eventType);
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("Invalid Kafka event payload for " + eventType.getSimpleName(), exception);
        }
    }
}
