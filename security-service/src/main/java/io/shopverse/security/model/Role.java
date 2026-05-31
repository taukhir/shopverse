package io.shopverse.security.model;

import java.util.Set;

public record Role(
        Long id,
        String roleName,
        String description,
        Set<Permission> permissions
) {
}
