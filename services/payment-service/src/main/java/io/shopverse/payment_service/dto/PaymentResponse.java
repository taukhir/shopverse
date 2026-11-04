package io.shopverse.payment_service.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record PaymentResponse(
        Long id,
        String orderNumber,
        String correlationId,
        BigDecimal amount,
        String status,
        String paymentReference,
        String failureReason,
        Instant createdAt,
        Instant updatedAt
) {
}
