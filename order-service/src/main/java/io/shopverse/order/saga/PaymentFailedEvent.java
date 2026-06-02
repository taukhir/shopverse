package io.shopverse.order.saga;

public record PaymentFailedEvent(
        Long orderId,
        String orderNumber,
        String reason
) {
}
