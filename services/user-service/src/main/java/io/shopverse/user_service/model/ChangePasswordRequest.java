package io.shopverse.user_service.model;

import io.shopverse.user_service.validation.StrongPassword;
import jakarta.validation.constraints.NotBlank;

public record ChangePasswordRequest(
        @NotBlank
        String currentPassword,

        @NotBlank
        @StrongPassword
        String newPassword
) {
}
