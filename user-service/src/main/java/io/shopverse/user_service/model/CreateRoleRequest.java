package io.shopverse.user_service.model;

import jakarta.validation.constraints.NotBlank;

import java.util.Set;

public record CreateRoleRequest(
    @NotBlank
    String roleName,

    String description,

    Set<String> permissions
) {
}
