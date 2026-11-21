package io.shopverse.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public record UpdateCheckoutRequest(
        @NotNull @Positive Long checkoutVersion,
        @NotEmpty @Size(max = 1) List<@Valid CheckoutItemRequest> items,
        @NotNull @Valid ShippingAddressRequest shippingAddress
) {
    public UpdateCheckoutRequest {
        items = items == null ? null : Collections.unmodifiableList(new ArrayList<>(items));
    }
}
