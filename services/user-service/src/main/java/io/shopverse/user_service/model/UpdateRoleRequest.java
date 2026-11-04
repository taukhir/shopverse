package io.shopverse.user_service.model;

import java.util.Set;

public record UpdateRoleRequest(
    String roleName,

    String description,

    Set<String> permissions
) {
}
