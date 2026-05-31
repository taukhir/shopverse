package io.shopverse.user_service.model;

import io.shopverse.user_service.validation.StrongPassword;
import jakarta.validation.constraints.NotBlank;

public record ResetPasswordRequest(
        @NotBlank
        @StrongPassword
        String newPassword
) {
}
