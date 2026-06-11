package io.shopverse.inventory_service.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record InventoryResponse(
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
