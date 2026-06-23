package io.shopverse.inventory_service.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.URL;

import java.math.BigDecimal;

public record InventoryUpsertRequest(
        @NotNull @Positive Long productId,
        @NotBlank @Size(max = 160) String productName,
        @NotBlank @Size(max = 80) String brand,
        @NotBlank @Size(max = 80) String model,
        @NotBlank @Size(max = 60) String category,
        @NotBlank @Size(max = 1000) String description,
        @NotBlank @URL @Size(max = 500) String imageUrl,
        @NotBlank @Size(max = 255) String imageKey,
        @NotNull @DecimalMin("0.01") BigDecimal unitPrice,
        @PositiveOrZero int availableQuantity
) {
}
