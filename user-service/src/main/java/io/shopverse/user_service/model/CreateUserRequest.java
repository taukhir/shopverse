package io.shopverse.user_service.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import io.shopverse.user_service.validation.StrongPassword;

import java.util.Set;

public record CreateUserRequest(
    @NotBlank
    @Pattern(regexp = "^[a-zA-Z0-9._-]{3,50}$", message = "Username must be 3-50 characters and contain only letters, numbers, dot, underscore, or hyphen")
    String username,

    @NotBlank
    @Email
    String email,

    @NotBlank
    @StrongPassword
    String password,

    String firstName,

    String lastName,

    @Pattern(regexp = "^$|^[+]?[0-9]{10,15}$", message = "Phone number must contain 10-15 digits and may start with +")
    String phoneNumber,

    Set<String> roles
) {
}
