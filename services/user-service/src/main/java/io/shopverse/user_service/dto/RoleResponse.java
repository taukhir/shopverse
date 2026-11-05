package io.shopverse.user_service.dto;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;

public record RoleResponse(
        Long id,
        String roleName,
        String description,
        Set<PermissionResponse> permissions
) {
    public RoleResponse {
        permissions = permissions == null ? null : Collections.unmodifiableSet(new LinkedHashSet<>(permissions));
    }

}
