package io.shopverse.user_service.mapper;

import io.shopverse.user_service.dto.PermissionResponse;
import io.shopverse.user_service.dto.RoleResponse;
import io.shopverse.user_service.dto.UserResponse;
import io.shopverse.user_service.dto.UserSummaryResponse;
import io.shopverse.user_service.entities.Permission;
import io.shopverse.user_service.entities.Role;
import io.shopverse.user_service.entities.User;
import io.shopverse.user_service.entities.UserGroup;

import java.util.Comparator;
import java.util.Set;
import java.util.stream.Collectors;

public final class UserMapper {

    private UserMapper() {
    }

    public static UserResponse toUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getUuid(),
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhoneNumber(),
                user.getStatus(),
                toRoleResponses(effectiveRoles(user))
        );
    }

    public static UserSummaryResponse toUserSummaryResponse(User user) {
        return new UserSummaryResponse(
                user.getId(),
                user.getUuid(),
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getStatus(),
                effectiveRoles(user)
                        .stream()
                        .map(Role::getRoleName)
                        .sorted()
                        .collect(Collectors.toCollection(java.util.LinkedHashSet::new))
        );
    }

    private static Set<Role> effectiveRoles(User user) {
        Set<Role> roles = new java.util.LinkedHashSet<>(user.getRoles());
        for (UserGroup group : user.getGroups()) {
            roles.addAll(group.getRoles());
        }
        return roles;
    }

    public static RoleResponse toRoleResponse(Role role) {
        return new RoleResponse(
                role.getId(),
                role.getRoleName(),
                role.getDescription(),
                toPermissionResponses(role.getPermissions())
        );
    }

    public static PermissionResponse toPermissionResponse(Permission permission) {
        return new PermissionResponse(
                permission.getId(),
                permission.getPermissionName(),
                permission.getDescription(),
                permission.getModuleName()
        );
    }

    private static Set<RoleResponse> toRoleResponses(Set<Role> roles) {
        return roles.stream()
                .sorted(Comparator.comparing(Role::getRoleName))
                .map(UserMapper::toRoleResponse)
                .collect(Collectors.toCollection(java.util.LinkedHashSet::new));
    }

    private static Set<PermissionResponse> toPermissionResponses(Set<Permission> permissions) {
        return permissions.stream()
                .sorted(Comparator.comparing(Permission::getPermissionName))
                .map(UserMapper::toPermissionResponse)
                .collect(Collectors.toCollection(java.util.LinkedHashSet::new));
    }
}
