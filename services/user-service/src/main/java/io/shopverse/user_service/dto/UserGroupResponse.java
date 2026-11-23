package io.shopverse.user_service.dto;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;

public record UserGroupResponse(Long id, String groupName, String description, long memberCount, Set<RoleResponse> roles) {
    public UserGroupResponse {
        roles = roles == null ? null : Collections.unmodifiableSet(new LinkedHashSet<>(roles));
    }
}
