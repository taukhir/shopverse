package io.shopverse.auth.model;

public record Permission(
        Long id,
        String permissionName,
        String description,
        String moduleName
) {
}
