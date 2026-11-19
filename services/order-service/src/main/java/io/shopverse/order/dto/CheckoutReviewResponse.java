package io.shopverse.order.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public record CheckoutReviewResponse(
        List<OrderItemResponse> items,
        ShippingAddressResponse shippingAddress,
        BigDecimal totalAmount,
        String currency
) {
    public CheckoutReviewResponse {
        items = items == null ? null : Collections.unmodifiableList(new ArrayList<>(items));
    }
}
