package io.shopverse.inventory_service.saga;

import java.math.BigDecimal;

public record OrderCreatedEvent(
        Long orderId,
        String orderNumber,
        String customerUsername,
        Long productId,
        Integer quantity,
        BigDecimal amount
) {
}
