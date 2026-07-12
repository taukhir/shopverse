package io.shopverse.user_service.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CartRequest(
        @NotNull @Size(max = 100) List<@Valid CartItemRequest> items
) {
}
