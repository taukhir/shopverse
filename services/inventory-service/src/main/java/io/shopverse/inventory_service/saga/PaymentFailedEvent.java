package io.shopverse.inventory_service.saga;

public record PaymentFailedEvent(
        Long orderId,
        String orderNumber,
        String correlationId,
        String reason
) {
}
