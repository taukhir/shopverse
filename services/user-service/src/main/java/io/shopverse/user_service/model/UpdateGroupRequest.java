package io.shopverse.user_service.model;

import jakarta.validation.constraints.Size;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;

public record UpdateGroupRequest(
        @Size(max = 80) String groupName,
        @Size(max = 500) String description,
        Set<Long> roleIds
) {
    public UpdateGroupRequest {
        roleIds = roleIds == null ? null : Collections.unmodifiableSet(new LinkedHashSet<>(roleIds));
    }
}
