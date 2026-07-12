package io.shopverse.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CheckoutRequest(
        @NotEmpty @Size(max = 1) List<@Valid CheckoutItemRequest> items,
        @NotNull @Valid ShippingAddressRequest shippingAddress
) {
}
