package io.shopverse.payment_service.config;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.math.BigDecimal;

@Validated
@ConfigurationProperties("shopverse.payment")
public record PaymentProperties(
        @DecimalMin("0.01") BigDecimal approvalLimit,
        @NotBlank String webhookSecret
) {
}
