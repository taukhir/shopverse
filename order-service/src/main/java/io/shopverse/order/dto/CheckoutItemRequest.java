package io.shopverse.order.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CheckoutItemRequest(
        @NotNull @Positive Long productId,
        @Positive int quantity
) {
}
