package io.shopverse.user_service.dto;

import java.util.Set;

public record UserGroupResponse(Long id, String groupName, String description, long memberCount, Set<RoleResponse> roles) {
}
