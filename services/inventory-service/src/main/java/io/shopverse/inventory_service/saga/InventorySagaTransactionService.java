package io.shopverse.inventory_service.saga;

import io.shopverse.inventory_service.config.KafkaTopicsProperties;
import io.shopverse.inventory_service.outbox.OutboxService;
import io.shopverse.inventory_service.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InventorySagaTransactionService {

    private final InventoryService inventoryService;
    private final OutboxService outboxService;
    private final KafkaTopicsProperties topics;

    @Transactional
    public void handleOrderCreated(OrderCreatedEvent event) {
        List<LineItem> items = event.items();
        List<Long> reservedProductIds = new ArrayList<>();
        Long failedProductId = null;

        for (LineItem item : items) {
            boolean reserved = inventoryService.reserve(
                    event.orderNumber(), event.correlationId(), item.productId(), item.quantity());
            if (!reserved) {
                failedProductId = item.productId();
                break;
            }
            reservedProductIds.add(item.productId());
        }

        boolean allReserved = failedProductId == null;
        if (!allReserved) {
            reservedProductIds.forEach(productId -> inventoryService.release(event.orderNumber(), productId));
        }

        Object outgoingEvent = allReserved
                ? new InventoryReservedEvent(
                        event.orderId(), event.orderNumber(), event.correlationId(),
                        event.customerUsername(), event.productId(), event.quantity(), event.amount(), items)
                : new InventoryFailedEvent(
                        event.orderId(), event.orderNumber(), event.correlationId(),
                        "Inventory not available for product " + failedProductId,
                        List.of(failedProductId));
        String topic = allReserved ? topics.inventoryReserved() : topics.inventoryFailed();
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
