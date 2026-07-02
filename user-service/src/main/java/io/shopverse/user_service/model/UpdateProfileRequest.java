package io.shopverse.user_service.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;

public record UpdateProfileRequest(
        @Email
        String email,

        String firstName,

        String lastName,

        @Pattern(regexp = "^$|^[+]?[0-9]{10,15}$", message = "Phone number must contain 10-15 digits and may start with +")
        String phoneNumber
) {
}
