package io.shopverse.user_service.dto;

public record PermissionResponse(
        Long id,
        String permissionName,
        String description,
        String moduleName
) {
}
