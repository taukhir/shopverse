package io.shopverse.inventory_service.config;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

@Validated
@ConfigurationProperties("shopverse.inventory")
/**
 * Centralized reservation timing controls. Duration binding accepts values
 * such as {@code 5m}, keeping scheduling policy outside business code.
 */
public record InventoryProperties(
        @NotNull Duration reservationTtl,
        @Positive long expiryScanDelayMs
) {
}
