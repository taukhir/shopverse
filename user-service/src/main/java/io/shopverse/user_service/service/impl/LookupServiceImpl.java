package io.shopverse.user_service.service.impl;

import io.github.resilience4j.retry.Retry;
import io.shopverse.user_service.config.CacheConfig;
import io.shopverse.user_service.entities.Permission;
import io.shopverse.user_service.entities.Role;
import io.shopverse.user_service.exceptions.ResourceNotFoundException;
import io.shopverse.user_service.repository.PermissionRepository;
import io.shopverse.user_service.repository.RoleRepository;
import io.shopverse.user_service.service.LookupService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

/**
 * Cached lookup facade for stable role and permission reads.
 * <p>
 * Lookup operations are read-only, so they can safely use a small Resilience4j
 * retry for transient repository/database errors. Domain "not found" responses
 * are still surfaced as {@link ResourceNotFoundException}.
 */
@Service
@RequiredArgsConstructor
public class LookupServiceImpl implements LookupService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final Retry lookupRetry;

    @Override
    @Cacheable(cacheNames = CacheConfig.ROLES_BY_NAME, key = "#roleName.toLowerCase()")
    public Role findRoleByName(String roleName) {
        return Retry.decorateSupplier(lookupRetry, () -> roleRepository.findByRoleName(roleName))
                .get()
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleName));
    }

    @Override
    @Cacheable(cacheNames = CacheConfig.PERMISSIONS_BY_NAME, key = "#permissionName.toLowerCase()")
    public Permission findPermissionByName(String permissionName) {
        return Retry.decorateSupplier(lookupRetry, () -> permissionRepository.findByPermissionName(permissionName))
                .get()
                .orElseThrow(() -> new ResourceNotFoundException("Permission not found: " + permissionName));
    }
}
