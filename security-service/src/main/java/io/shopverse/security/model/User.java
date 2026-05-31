package io.shopverse.security.model;

import io.shopverse.security.model.enums.UserStatus;

import java.util.Set;

public record User(
        Long id,
        String uuid,
        String username,
        String password,
        String email,
        String firstName,
        String lastName,
        String phoneNumber,
        UserStatus status,
        Set<Role> roles
) {
}
