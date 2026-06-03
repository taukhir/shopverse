package io.shopverse.order.saga;

public record InventoryFailedEvent(
        Long orderId,
        String orderNumber,
        String correlationId,
        String reason
) {
}
