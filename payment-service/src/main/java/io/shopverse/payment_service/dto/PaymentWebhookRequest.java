package io.shopverse.payment_service.dto;

import io.shopverse.payment_service.entity.PaymentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PaymentWebhookRequest(
        @NotBlank @Size(max = 40) String orderNumber,
        @NotNull PaymentStatus status,
        @Size(max = 80) String paymentReference,
        @Size(max = 500) String reason
) {
}
