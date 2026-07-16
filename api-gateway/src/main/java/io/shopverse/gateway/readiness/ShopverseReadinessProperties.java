package io.shopverse.gateway.readiness;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
import java.util.List;

@ConfigurationProperties(prefix = "shopverse.readiness")
public record ShopverseReadinessProperties(
        List<String> requiredServices,
        List<String> requiredRouteIds,
        int minimumSeedProducts,
        Duration timeout,
        String minioObjectBaseUrl
) {
    public ShopverseReadinessProperties {
        requiredServices = defaultList(requiredServices, List.of(
                "AUTH-SERVICE",
                "USER-SERVICE",
                "ORDER-SERVICE",
                "PAYMENT-SERVICE",
                "INVENTORY-SERVICE"
        ));
        requiredRouteIds = defaultList(requiredRouteIds, List.of(
                "auth-service",
                "user-service",
                "order-service",
                "payment-service",
                "inventory-service"
        ));
        minimumSeedProducts = minimumSeedProducts > 0 ? minimumSeedProducts : 5;
        timeout = timeout != null ? timeout : Duration.ofSeconds(3);
        minioObjectBaseUrl = minioObjectBaseUrl == null ? "" : trimTrailingSlash(minioObjectBaseUrl);
    }

    private static List<String> defaultList(List<String> value, List<String> fallback) {
        return value == null || value.isEmpty() ? fallback : List.copyOf(value);
    }

    private static String trimTrailingSlash(String value) {
        String trimmed = value.trim();
        while (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }
}
