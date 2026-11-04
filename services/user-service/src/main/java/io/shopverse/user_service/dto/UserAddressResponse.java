package io.shopverse.user_service.dto;

import java.time.LocalDateTime;

public record UserAddressResponse(
        Long id,
        String label,
        String recipientName,
        String phoneNumber,
        String line1,
        String line2,
        String city,
        String state,
        String postalCode,
        String country,
        boolean defaultAddress,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
