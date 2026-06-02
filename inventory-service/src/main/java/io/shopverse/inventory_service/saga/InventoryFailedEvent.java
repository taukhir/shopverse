package io.shopverse.inventory_service.saga;

public record InventoryFailedEvent(
        Long orderId,
        String orderNumber,
        String reason
) {
}
