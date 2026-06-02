package io.shopverse.inventory_service.dto;

public record ServiceHealthResponse(
        String service,
        String status,
        String message
) {
}
