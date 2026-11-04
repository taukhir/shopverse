package io.shopverse.payment_service.dto;

public record ServiceHealthResponse(
        String service,
        String status,
        String message
) {
}
