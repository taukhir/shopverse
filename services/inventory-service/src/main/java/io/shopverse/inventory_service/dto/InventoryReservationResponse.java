package io.shopverse.inventory_service.dto;

import java.time.Instant;

public record InventoryReservationResponse(
        Long id,
        String orderNumber,
        String correlationId,
        Long productId,
        int quantity,
        String status,
        Instant expiresAt
) {
}
