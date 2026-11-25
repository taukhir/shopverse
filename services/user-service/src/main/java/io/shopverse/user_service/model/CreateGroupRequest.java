package io.shopverse.user_service.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;

public record CreateGroupRequest(
        @NotBlank @Size(max = 80) String groupName,
        @Size(max = 500) String description,
        Set<Long> roleIds
) {
    public CreateGroupRequest {
        roleIds = roleIds == null ? null : Collections.unmodifiableSet(new LinkedHashSet<>(roleIds));
    }
}
