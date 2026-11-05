package io.shopverse.user_service.dto;

import io.shopverse.user_service.entities.enums.UserStatus;

import java.util.Collections;
import java.util.LinkedHashSet;
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
    public UserSummaryResponse {
        roles = roles == null ? null : Collections.unmodifiableSet(new LinkedHashSet<>(roles));
    }

}
