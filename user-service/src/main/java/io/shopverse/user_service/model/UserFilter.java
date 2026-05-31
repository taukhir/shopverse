package io.shopverse.user_service.model;

import io.shopverse.user_service.entities.enums.UserStatus;

public record UserFilter(
        String search,
        UserStatus status,
        String role
) {
}
