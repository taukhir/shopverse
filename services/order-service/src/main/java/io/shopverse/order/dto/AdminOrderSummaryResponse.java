package io.shopverse.order.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record AdminOrderSummaryResponse(
        Long id,
        String orderNumber,
        String customerUsername,
        String status,
        String currency,
        BigDecimal totalAmount,
        Instant createdAt
) {
}
