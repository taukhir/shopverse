package io.shopverse.user_service.service.impl;

import io.shopverse.platform.web.pagination.PageMapper;
import io.shopverse.platform.web.pagination.PageResponse;
import io.shopverse.user_service.config.CacheConfig;
import io.shopverse.user_service.dto.RoleResponse;
import io.shopverse.user_service.entities.Permission;
import io.shopverse.user_service.entities.Role;
import io.shopverse.user_service.exceptions.DuplicateResourceException;
import io.shopverse.user_service.exceptions.ResourceInUseException;
import io.shopverse.user_service.exceptions.ResourceNotFoundException;
import io.shopverse.user_service.mapper.UserMapper;
import io.shopverse.user_service.model.CreateRoleRequest;
import io.shopverse.user_service.model.RoleFilter;
import io.shopverse.user_service.model.UpdateRoleRequest;
import io.shopverse.user_service.repository.RoleRepository;
import io.shopverse.user_service.repository.specification.RoleSpecifications;
import io.shopverse.user_service.service.AdminAuditEventService;
import io.shopverse.user_service.service.LookupService;
import io.shopverse.user_service.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoleServiceImpl implements RoleService {

    private final RoleRepository roleRepository;
    private final LookupService lookupService;
    private final AdminAuditEventService adminAuditEventService;

    @Override
    public PageResponse<RoleResponse> getRoles(RoleFilter filter, Pageable pageable) {
        return PageMapper.toResponse(
                roleRepository.findAll(RoleSpecifications.from(filter), pageable),
                UserMapper::toRoleResponse
        );
    }

    @Override
    public RoleResponse getRole(Long id) {
        return UserMapper.toRoleResponse(findRole(id));
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CacheConfig.ROLES_BY_NAME, allEntries = true)
    public RoleResponse createRole(CreateRoleRequest request) {
        if (roleRepository.existsByRoleName(request.roleName())) {
            throw new DuplicateResourceException("Role already exists");
        }

        Role role = Role.builder()
                .roleName(request.roleName())
                .description(request.description())
                .permissions(resolvePermissions(request.permissions()))
                .build();

        Role savedRole = roleRepository.save(role);
        recordRoleAudit(savedRole, "ROLE_CREATED", "Role created");
        return UserMapper.toRoleResponse(savedRole);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CacheConfig.ROLES_BY_NAME, allEntries = true)
    public RoleResponse updateRole(Long id, UpdateRoleRequest request) {
        Role role = findRole(id);

        if (request.roleName() != null && !request.roleName().equals(role.getRoleName())) {
            if (roleRepository.existsByRoleName(request.roleName())) {
                throw new DuplicateResourceException("Role already exists");
            }
            role.setRoleName(request.roleName());
        }

        if (request.description() != null) {
            role.setDescription(request.description());
        }

        if (request.permissions() != null) {
            role.setPermissions(resolvePermissions(request.permissions()));
        }

        Role savedRole = roleRepository.save(role);
        recordRoleAudit(savedRole, "ROLE_UPDATED", "Role updated");
        return UserMapper.toRoleResponse(savedRole);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CacheConfig.ROLES_BY_NAME, allEntries = true)
    public void deleteRole(Long id) {
        Role role = findRole(id);
        if (!role.getUsers().isEmpty()) {
            throw new ResourceInUseException("Role is assigned to one or more users");
        }
        roleRepository.delete(role);
        recordRoleAudit(role, "ROLE_DELETED", "Role deleted");
    }

    private void recordRoleAudit(Role role, String action, String title) {
        adminAuditEventService.record(
                "USERS",
                action,
                title,
                "SUCCESS",
                role.getRoleName(),
                title + ": " + role.getRoleName(),
                title + ": " + role.getRoleName(),
                "ROLE",
                String.valueOf(role.getId()),
                null,
                java.util.Map.of("roleName", role.getRoleName())
        );
    }

    private Role findRole(Long id) {
        return roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + id));
    }

    private Set<Permission> resolvePermissions(Set<String> permissionNames) {
        if (permissionNames == null || permissionNames.isEmpty()) {
            return new HashSet<>();
        }

        Set<Permission> permissions = new HashSet<>();
        for (String permissionName : permissionNames) {
            permissions.add(lookupService.findPermissionByName(permissionName));
        }
        return permissions;
    }
}
