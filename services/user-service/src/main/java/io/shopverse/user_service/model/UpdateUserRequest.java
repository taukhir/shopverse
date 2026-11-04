package io.shopverse.user_service.model;

import io.shopverse.user_service.entities.enums.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;

import java.util.Set;

public record UpdateUserRequest(
    @Pattern(regexp = "^[a-zA-Z0-9._-]{3,50}$", message = "Username must be 3-50 characters and contain only letters, numbers, dot, underscore, or hyphen")
    String username,

    @Email
    String email,

    String firstName,

    String lastName,

    @Pattern(regexp = "^$|^[+]?[0-9]{10,15}$", message = "Phone number must contain 10-15 digits and may start with +")
    String phoneNumber,

    UserStatus status,

    Boolean enabled,

    Boolean accountNonLocked,

    Set<String> roles
) {
}
