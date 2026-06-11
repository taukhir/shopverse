package io.shopverse.order.client;

import java.math.BigDecimal;
import java.time.Instant;

public record InventoryCatalogItem(
        Long id,
        Long productId,
        String productName,
        BigDecimal unitPrice,
        int availableQuantity,
        int reservedQuantity,
        boolean available,
        Instant updatedAt
) {
}
