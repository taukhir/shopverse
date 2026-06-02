package io.shopverse.inventory_service.saga;

import java.math.BigDecimal;

public record InventoryReservedEvent(
        Long orderId,
        String orderNumber,
        Long productId,
        Integer quantity,
        BigDecimal amount
) {
}
