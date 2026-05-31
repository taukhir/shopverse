package io.shopverse.security.model;

public record Permission(
        Long id,
        String permissionName,
        String description,
        String moduleName
) {
}
