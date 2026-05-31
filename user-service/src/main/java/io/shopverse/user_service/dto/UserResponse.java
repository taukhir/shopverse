package io.shopverse.user_service.dto;

import io.shopverse.user_service.entities.enums.UserStatus;

import java.util.Set;

public record UserResponse(
        Long id,
        String uuid,
        String username,
        String password,
        String email,
        String firstName,
        String lastName,
        String phoneNumber,
        UserStatus status,
        Set<RoleResponse> roles
) {
}
