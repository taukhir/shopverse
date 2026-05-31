package io.shopverse.user_service.dto;

import java.util.Set;

public record RoleResponse(
        Long id,
        String roleName,
        String description,
        Set<PermissionResponse> permissions
) {
}
