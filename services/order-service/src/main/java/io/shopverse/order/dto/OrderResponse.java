package io.shopverse.order.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
        Long id,
        String orderNumber,
        String correlationId,
        String idempotencyKey,
        String customerUsername,
        String status,
        BigDecimal totalAmount,
        ShippingAddressResponse shippingAddress,
        List<OrderItemResponse> items,
        Instant createdAt
) {
}
