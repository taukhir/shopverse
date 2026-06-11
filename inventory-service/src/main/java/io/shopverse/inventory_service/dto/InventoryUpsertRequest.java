package io.shopverse.inventory_service.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record InventoryUpsertRequest(
        @NotNull @Positive Long productId,
        @NotBlank String productName,
        @NotNull @DecimalMin("0.01") BigDecimal unitPrice,
        @PositiveOrZero int availableQuantity
) {
}
