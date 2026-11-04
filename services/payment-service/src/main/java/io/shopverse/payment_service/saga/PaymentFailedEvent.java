package io.shopverse.payment_service.saga;

public record PaymentFailedEvent(
        Long orderId,
        String orderNumber,
        String correlationId,
        String reason
) {
}
