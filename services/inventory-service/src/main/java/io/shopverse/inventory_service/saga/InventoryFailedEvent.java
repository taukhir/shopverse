package io.shopverse.inventory_service.saga;

import java.util.List;

public record InventoryFailedEvent(
        Long orderId,
        String orderNumber,
        String correlationId,
        String reason,
        List<Long> failedProductIds
) {
}
