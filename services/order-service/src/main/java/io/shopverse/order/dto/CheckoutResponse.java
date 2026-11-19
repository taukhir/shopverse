package io.shopverse.order.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public record CheckoutResponse(
        String checkoutId,
        Long version,
        String status,
        List<OrderItemResponse> items,
        ShippingAddressResponse shippingAddress,
        String currency,
        BigDecimal totalAmount,
        Instant expiresAt,
        Long orderId
) {
    public CheckoutResponse {
        items = items == null ? null : Collections.unmodifiableList(new ArrayList<>(items));
    }
}
