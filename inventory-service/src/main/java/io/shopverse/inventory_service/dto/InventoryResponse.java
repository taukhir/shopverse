package io.shopverse.inventory_service.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record InventoryResponse(
        Long id,
        Long productId,
        String productName,
        String brand,
        String model,
        String category,
        String description,
        String imageUrl,
        String imageKey,
        BigDecimal unitPrice,
        int availableQuantity,
        int reservedQuantity,
        boolean available,
        Instant updatedAt
) {
}
