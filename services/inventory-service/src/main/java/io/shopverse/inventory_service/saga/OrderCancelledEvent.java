package io.shopverse.inventory_service.saga;

public record OrderCancelledEvent(
        Long orderId,
        String orderNumber,
        String correlationId,
        String customerUsername,
        String reason
) {
}
