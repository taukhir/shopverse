package io.shopverse.inventory_service.config;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

/**
 * Configuration properties related to inventory management.
 *
 * Spring Boot automatically binds properties from:
 *
 * shopverse.inventory.*
 *
 * Example:
 *
 * shopverse:
 *   inventory:
 *     reservation-ttl: 5m
 *     expiry-scan-delay-ms: 30000
 *
 * This keeps configuration outside the source code and allows
 * changing values without recompiling the application.
 */
@Validated
@ConfigurationProperties(prefix = "shopverse.inventory")
public record InventoryProperties(

        /**
         * Time-To-Live (TTL) for an inventory reservation.
         *
         * Example:
         * reservation-ttl: 5m
         *
         * Spring converts:
         * 5m  -> Duration.ofMinutes(5)
         * 30s -> Duration.ofSeconds(30)
         * 1h  -> Duration.ofHours(1)
         *
         * Must not be null.
         */
        @NotNull
        Duration reservationTtl,

        /**
         * Delay between inventory expiration scans.
         *
         * Example:
         * expiry-scan-delay-ms: 30000
         *
         * Means:
         * scan every 30 seconds for expired reservations.
         *
         * Must be greater than zero.
         */
        @Positive
        long expiryScanDelayMs

) {
}
