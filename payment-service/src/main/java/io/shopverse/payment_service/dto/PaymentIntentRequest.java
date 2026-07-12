package io.shopverse.payment_service.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record PaymentIntentRequest(
        @NotBlank @Size(max = 40) String orderNumber,
        @NotBlank @Size(max = 64) String correlationId,
        @NotNull @DecimalMin(value = "0.01") BigDecimal amount
) {
}
