package io.shopverse.order.saga;

import java.math.BigDecimal;

public record InventoryReservedEvent(
        Long orderId,
        String orderNumber,
        String correlationId,
        Long productId,
        Integer quantity,
        BigDecimal amount
) {
}
