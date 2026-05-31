package io.shopverse.order.dto;

public record OrderDeleteResponse(
        Long orderId,
        String status,
        String message
) {
}
