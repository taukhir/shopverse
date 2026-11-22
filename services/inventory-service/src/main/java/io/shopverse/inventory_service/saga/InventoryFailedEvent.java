package io.shopverse.inventory_service.saga;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public record InventoryFailedEvent(
        Long orderId,
        String orderNumber,
        String correlationId,
        String reason,
        List<Long> failedProductIds
) {
    public InventoryFailedEvent {
        failedProductIds = failedProductIds == null ? null : Collections.unmodifiableList(new ArrayList<>(failedProductIds));
    }
}
