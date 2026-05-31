package io.shopverse.user_service.dto;

import io.shopverse.user_service.entities.enums.UserStatus;

import java.util.Set;

public record UserSummaryResponse(
        Long id,
        String uuid,
        String username,
        String email,
        String firstName,
        String lastName,
        UserStatus status,
        Set<String> roles
) {
}
