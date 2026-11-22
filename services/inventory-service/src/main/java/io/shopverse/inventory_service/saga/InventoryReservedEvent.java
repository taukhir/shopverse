package io.shopverse.inventory_service.saga;

import java.math.BigDecimal;
import java.util.List;

public record InventoryReservedEvent(
        Long orderId,
        String orderNumber,
        String correlationId,
        String customerUsername,
        Long productId,
        Integer quantity,
        BigDecimal amount,
        List<LineItem> items
) {
}
