package io.shopverse.payment_service.saga;

import java.math.BigDecimal;

public record PaymentCompletedEvent(
        Long orderId,
        String orderNumber,
        String correlationId,
        String paymentReference,
        BigDecimal amount
) {
}
