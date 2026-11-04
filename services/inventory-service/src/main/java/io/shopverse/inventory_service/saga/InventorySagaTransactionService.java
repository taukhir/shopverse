package io.shopverse.inventory_service.saga;

import io.shopverse.inventory_service.config.KafkaTopicsProperties;
import io.shopverse.inventory_service.outbox.OutboxService;
import io.shopverse.inventory_service.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InventorySagaTransactionService {

    private final InventoryService inventoryService;
    private final OutboxService outboxService;
    private final KafkaTopicsProperties topics;

    @Transactional
    public void handleOrderCreated(OrderCreatedEvent event) {
        boolean reserved = inventoryService.reserve(
                event.orderNumber(),
                event.correlationId(),
                event.productId(),
                event.quantity()
        );
        Object outgoingEvent = reserved
                ? new InventoryReservedEvent(
                        event.orderId(), event.orderNumber(), event.correlationId(),
                        event.customerUsername(), event.productId(), event.quantity(), event.amount())
                : new InventoryFailedEvent(
                        event.orderId(), event.orderNumber(), event.correlationId(),
                        "Inventory not available for product " + event.productId());
        String topic = reserved ? topics.inventoryReserved() : topics.inventoryFailed();
        outboxService.enqueue(
                "INVENTORY_RESERVATION",
                event.orderNumber(),
                outgoingEvent.getClass().getSimpleName(),
                topic,
                event.orderNumber(),
                outgoingEvent,
                event.correlationId()
        );
    }
}
