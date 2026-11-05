package io.shopverse.auth.model;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;

public record Role(
        Long id,
        String roleName,
        String description,
        Set<Permission> permissions
) {
    public Role {
        permissions = permissions == null ? null : Collections.unmodifiableSet(new LinkedHashSet<>(permissions));
    }

}
