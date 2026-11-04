package io.shopverse.user_service.model;

import jakarta.validation.constraints.NotBlank;

public record CreatePermissionRequest(
    @NotBlank
    String permissionName,

    String description,

    String moduleName
) {
}
