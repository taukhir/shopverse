package io.shopverse.order.saga;

import java.math.BigDecimal;

public record PaymentCompletedEvent(
        Long orderId,
        String orderNumber,
        String paymentReference,
        BigDecimal amount
) {
}
