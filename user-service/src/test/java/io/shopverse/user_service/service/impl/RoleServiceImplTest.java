package io.shopverse.user_service.service.impl;

import io.shopverse.user_service.dto.PageResponse;
import io.shopverse.user_service.dto.RoleResponse;
import io.shopverse.user_service.entities.Permission;
import io.shopverse.user_service.entities.Role;
import io.shopverse.user_service.entities.User;
import io.shopverse.user_service.exceptions.DuplicateResourceException;
import io.shopverse.user_service.exceptions.ResourceInUseException;
import io.shopverse.user_service.exceptions.ResourceNotFoundException;
import io.shopverse.user_service.model.CreateRoleRequest;
import io.shopverse.user_service.model.RoleFilter;
import io.shopverse.user_service.model.UpdateRoleRequest;
import io.shopverse.user_service.repository.RoleRepository;
import io.shopverse.user_service.service.LookupService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RoleServiceImplTest {

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private LookupService lookupService;

    private RoleServiceImpl roleService;

    @BeforeEach
    void setUp() {
        roleService = new RoleServiceImpl(roleRepository, lookupService);
    }

    @Test
    void getRolesReturnsPagedRoles() {
        Role role = role(1L, "ADMIN", Set.of(permission(1L, "USER_READ")), Set.of());
        when(roleRepository.findAll(any(Specification.class), eq(PageRequest.of(0, 10))))
                .thenReturn(new PageImpl<>(List.of(role), PageRequest.of(0, 10), 1));

        PageResponse<RoleResponse> response = roleService.getRoles(
                new RoleFilter("admin", "USER_READ"),
                PageRequest.of(0, 10)
        );

        assertThat(response.totalElements()).isEqualTo(1);
        assertThat(response.content().getFirst().roleName()).isEqualTo("ADMIN");
        assertThat(response.content().getFirst().permissions()).hasSize(1);
    }

    @Test
    void createRoleAssignsPermissions() {
        Permission permission = permission(1L, "USER_READ");
        when(roleRepository.existsByRoleName("ADMIN")).thenReturn(false);
        when(lookupService.findPermissionByName("USER_READ")).thenReturn(permission);
        when(roleRepository.save(any(Role.class))).thenAnswer(invocation -> {
            Role saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });

        RoleResponse response = roleService.createRole(new CreateRoleRequest(
                "ADMIN",
                "Admin role",
                Set.of("USER_READ")
        ));

        ArgumentCaptor<Role> roleCaptor = ArgumentCaptor.forClass(Role.class);
        verify(roleRepository).save(roleCaptor.capture());

        assertThat(response.roleName()).isEqualTo("ADMIN");
        assertThat(roleCaptor.getValue().getPermissions()).containsExactly(permission);
    }

    @Test
    void createRoleThrowsWhenDuplicate() {
        when(roleRepository.existsByRoleName("ADMIN")).thenReturn(true);

        assertThatThrownBy(() -> roleService.createRole(new CreateRoleRequest(
                "ADMIN",
                null,
                Set.of()
        )))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessage("Role already exists");

        verify(roleRepository, never()).save(any(Role.class));
    }

    @Test
    void updateRoleThrowsWhenPermissionDoesNotExist() {
        Role role = role(1L, "ADMIN", Set.of(), Set.of());
        when(roleRepository.findById(1L)).thenReturn(Optional.of(role));
        when(lookupService.findPermissionByName("MISSING"))
                .thenThrow(new ResourceNotFoundException("Permission not found: MISSING"));

        assertThatThrownBy(() -> roleService.updateRole(1L, new UpdateRoleRequest(
                null,
                null,
                Set.of("MISSING")
        )))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Permission not found: MISSING");
    }

    @Test
    void deleteRoleThrowsWhenRoleIsAssignedToUsers() {
        Role role = role(1L, "ADMIN", Set.of(), Set.of(new User()));
        when(roleRepository.findById(1L)).thenReturn(Optional.of(role));

        assertThatThrownBy(() -> roleService.deleteRole(1L))
                .isInstanceOf(ResourceInUseException.class)
                .hasMessage("Role is assigned to one or more users");

        verify(roleRepository, never()).delete(any(Role.class));
    }

    @Test
    void deleteRoleDeletesUnassignedRole() {
        Role role = role(1L, "ADMIN", Set.of(), Set.of());
        when(roleRepository.findById(1L)).thenReturn(Optional.of(role));

        roleService.deleteRole(1L);

        verify(roleRepository).delete(role);
    }

    private Role role(Long id, String roleName, Set<Permission> permissions, Set<User> users) {
        Role role = Role.builder()
                .roleName(roleName)
                .description(roleName + " role")
                .permissions(permissions)
                .users(users)
                .build();
        role.setId(id);
        return role;
    }

    private Permission permission(Long id, String permissionName) {
        Permission permission = Permission.builder()
                .permissionName(permissionName)
                .description(permissionName + " permission")
                .moduleName("USER")
                .roles(Set.of())
                .build();
        permission.setId(id);
        return permission;
    }
}
