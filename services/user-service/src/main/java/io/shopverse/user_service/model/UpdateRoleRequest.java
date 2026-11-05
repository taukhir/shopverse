package io.shopverse.user_service.model;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;

public record UpdateRoleRequest(
    String roleName,

    String description,

    Set<String> permissions
) {
    public UpdateRoleRequest {
        permissions = permissions == null ? null : Collections.unmodifiableSet(new LinkedHashSet<>(permissions));
    }

}
