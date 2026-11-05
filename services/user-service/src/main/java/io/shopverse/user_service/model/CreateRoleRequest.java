package io.shopverse.user_service.model;

import jakarta.validation.constraints.NotBlank;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;

public record CreateRoleRequest(
    @NotBlank
    String roleName,

    String description,

    Set<String> permissions
) {
    public CreateRoleRequest {
        permissions = permissions == null ? null : Collections.unmodifiableSet(new LinkedHashSet<>(permissions));
    }

}
