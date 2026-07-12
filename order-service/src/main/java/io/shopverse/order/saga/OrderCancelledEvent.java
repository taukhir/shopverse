package io.shopverse.order.saga;

public record OrderCancelledEvent(
        Long orderId,
        String orderNumber,
        String correlationId,
        String customerUsername,
        String reason
) {
}
