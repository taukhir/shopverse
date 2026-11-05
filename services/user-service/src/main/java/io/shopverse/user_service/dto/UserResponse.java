package io.shopverse.user_service.dto;

import io.shopverse.user_service.entities.enums.UserStatus;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;

public record UserResponse(
        Long id,
        String uuid,
        String username,
        String email,
        String firstName,
        String lastName,
        String phoneNumber,
        UserStatus status,
        Set<RoleResponse> roles
) {
    public UserResponse {
        roles = roles == null ? null : Collections.unmodifiableSet(new LinkedHashSet<>(roles));
    }

}
