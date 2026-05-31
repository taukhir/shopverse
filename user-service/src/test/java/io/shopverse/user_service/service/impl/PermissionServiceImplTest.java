package io.shopverse.user_service.service.impl;

import io.shopverse.user_service.dto.PageResponse;
import io.shopverse.user_service.dto.PermissionResponse;
import io.shopverse.user_service.entities.Permission;
import io.shopverse.user_service.entities.Role;
import io.shopverse.user_service.exceptions.DuplicateResourceException;
import io.shopverse.user_service.exceptions.ResourceInUseException;
import io.shopverse.user_service.exceptions.ResourceNotFoundException;
import io.shopverse.user_service.model.CreatePermissionRequest;
import io.shopverse.user_service.model.PermissionFilter;
import io.shopverse.user_service.model.UpdatePermissionRequest;
import io.shopverse.user_service.repository.PermissionRepository;
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
class PermissionServiceImplTest {

    @Mock
    private PermissionRepository permissionRepository;

    private PermissionServiceImpl permissionService;

    @BeforeEach
    void setUp() {
        permissionService = new PermissionServiceImpl(permissionRepository);
    }

    @Test
    void getPermissionsReturnsPagedPermissions() {
        Permission permission = permission(1L, "USER_READ", Set.of());
        when(permissionRepository.findAll(any(Specification.class), eq(PageRequest.of(0, 10))))
                .thenReturn(new PageImpl<>(List.of(permission), PageRequest.of(0, 10), 1));

        PageResponse<PermissionResponse> response = permissionService.getPermissions(
                new PermissionFilter("read", "USER"),
                PageRequest.of(0, 10)
        );

        assertThat(response.totalElements()).isEqualTo(1);
        assertThat(response.content().getFirst().permissionName()).isEqualTo("USER_READ");
    }

    @Test
    void createPermissionPersistsPermission() {
        when(permissionRepository.existsByPermissionName("USER_READ")).thenReturn(false);
        when(permissionRepository.save(any(Permission.class))).thenAnswer(invocation -> {
            Permission saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });

        PermissionResponse response = permissionService.createPermission(new CreatePermissionRequest(
                "USER_READ",
                "Read users",
                "USER"
        ));

        ArgumentCaptor<Permission> permissionCaptor = ArgumentCaptor.forClass(Permission.class);
        verify(permissionRepository).save(permissionCaptor.capture());

        assertThat(response.permissionName()).isEqualTo("USER_READ");
        assertThat(permissionCaptor.getValue().getModuleName()).isEqualTo("USER");
    }

    @Test
    void createPermissionThrowsWhenDuplicate() {
        when(permissionRepository.existsByPermissionName("USER_READ")).thenReturn(true);

        assertThatThrownBy(() -> permissionService.createPermission(new CreatePermissionRequest(
                "USER_READ",
                null,
                "USER"
        )))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessage("Permission already exists");

        verify(permissionRepository, never()).save(any(Permission.class));
    }

    @Test
    void updatePermissionThrowsWhenMissing() {
        when(permissionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> permissionService.updatePermission(99L, new UpdatePermissionRequest(
                "USER_WRITE",
                null,
                null
        )))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Permission not found with id: 99");
    }

    @Test
    void deletePermissionThrowsWhenAssignedToRoles() {
        Permission permission = permission(1L, "USER_READ", Set.of(new Role()));
        when(permissionRepository.findById(1L)).thenReturn(Optional.of(permission));

        assertThatThrownBy(() -> permissionService.deletePermission(1L))
                .isInstanceOf(ResourceInUseException.class)
                .hasMessage("Permission is assigned to one or more roles");

        verify(permissionRepository, never()).delete(any(Permission.class));
    }

    @Test
    void deletePermissionDeletesUnassignedPermission() {
        Permission permission = permission(1L, "USER_READ", Set.of());
        when(permissionRepository.findById(1L)).thenReturn(Optional.of(permission));

        permissionService.deletePermission(1L);

        verify(permissionRepository).delete(permission);
    }

    private Permission permission(Long id, String permissionName, Set<Role> roles) {
        Permission permission = Permission.builder()
                .permissionName(permissionName)
                .description(permissionName + " permission")
                .moduleName("USER")
                .roles(roles)
                .build();
        permission.setId(id);
        return permission;
    }
}
