package io.shopverse.auth.model;

import io.shopverse.auth.model.enums.UserStatus;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;

public record User(
        Long id,
        String uuid,
        String username,
        String email,
        String firstName,
        String lastName,
        String phoneNumber,
        UserStatus status,
        Set<Role> roles
) {
    public User {
        roles = roles == null ? null : Collections.unmodifiableSet(new LinkedHashSet<>(roles));
    }

}
