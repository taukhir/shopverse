package io.shopverse.order.saga;

import java.math.BigDecimal;

public record OrderCreatedEvent(
        Long orderId,
        String orderNumber,
        String correlationId,
        String customerUsername,
        Long productId,
        Integer quantity,
        BigDecimal amount
) {
}
