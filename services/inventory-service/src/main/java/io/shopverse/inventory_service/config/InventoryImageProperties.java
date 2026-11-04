package io.shopverse.inventory_service.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "shopverse.inventory.images")
public record InventoryImageProperties(
        String endpoint,
        String publicEndpoint,
        String accessKey,
        String secretKey,
        String bucket,
        long maxSizeBytes
) {
    public InventoryImageProperties {
        endpoint = defaultValue(endpoint, "http://localhost:9000");
        publicEndpoint = defaultValue(publicEndpoint, endpoint);
        accessKey = defaultValue(accessKey, "shopverse-minio");
        secretKey = defaultValue(secretKey, "shopverse-minio-secret");
        bucket = defaultValue(bucket, "shopverse-product-images");
        maxSizeBytes = maxSizeBytes > 0 ? maxSizeBytes : 5 * 1024 * 1024;
    }

    private static String defaultValue(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}
