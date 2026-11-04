package io.shopverse.user_service.model;

public record UpdatePermissionRequest(
    String permissionName,

    String description,

    String moduleName
) {
}
