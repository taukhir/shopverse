package io.shopverse.user_service.service.impl;

import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryConfig;
import io.shopverse.user_service.entities.Permission;
import io.shopverse.user_service.entities.Role;
import io.shopverse.user_service.exceptions.ResourceNotFoundException;
import io.shopverse.user_service.repository.PermissionRepository;
import io.shopverse.user_service.repository.RoleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LookupServiceImplTest {

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PermissionRepository permissionRepository;

    private LookupServiceImpl lookupService;

    @BeforeEach
    void setUp() {
        lookupService = new LookupServiceImpl(
                roleRepository,
                permissionRepository,
                Retry.of("test-lookup-retry", RetryConfig.custom()
                        .maxAttempts(1)
                        .waitDuration(Duration.ZERO)
                        .build())
        );
    }

    @Test
    void findRoleByNameReturnsRole() {
        Role role = Role.builder().roleName("ADMIN").build();
        when(roleRepository.findByRoleName("ADMIN")).thenReturn(Optional.of(role));

        Role response = lookupService.findRoleByName("ADMIN");

        assertThat(response).isSameAs(role);
    }

    @Test
    void findRoleByNameThrowsWhenMissing() {
        when(roleRepository.findByRoleName("MISSING")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> lookupService.findRoleByName("MISSING"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Role not found: MISSING");
    }

    @Test
    void findPermissionByNameReturnsPermission() {
        Permission permission = Permission.builder().permissionName("USER_READ").build();
        when(permissionRepository.findByPermissionName("USER_READ")).thenReturn(Optional.of(permission));

        Permission response = lookupService.findPermissionByName("USER_READ");

        assertThat(response).isSameAs(permission);
    }

    @Test
    void findPermissionByNameThrowsWhenMissing() {
        when(permissionRepository.findByPermissionName("MISSING")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> lookupService.findPermissionByName("MISSING"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Permission not found: MISSING");
    }
}
