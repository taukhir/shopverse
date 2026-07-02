package io.shopverse.user_service.service.impl;

import io.shopverse.platform.web.pagination.PageMapper;
import io.shopverse.platform.web.pagination.PageResponse;
import io.shopverse.user_service.config.CacheConfig;
import io.shopverse.user_service.dto.PermissionResponse;
import io.shopverse.user_service.entities.Permission;
import io.shopverse.user_service.exceptions.DuplicateResourceException;
import io.shopverse.user_service.exceptions.ResourceInUseException;
import io.shopverse.user_service.exceptions.ResourceNotFoundException;
import io.shopverse.user_service.mapper.UserMapper;
import io.shopverse.user_service.model.CreatePermissionRequest;
import io.shopverse.user_service.model.PermissionFilter;
import io.shopverse.user_service.model.UpdatePermissionRequest;
import io.shopverse.user_service.repository.PermissionRepository;
import io.shopverse.user_service.repository.specification.PermissionSpecifications;
import io.shopverse.user_service.service.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PermissionServiceImpl implements PermissionService {

    private final PermissionRepository permissionRepository;

    @Override
    public PageResponse<PermissionResponse> getPermissions(PermissionFilter filter, Pageable pageable) {
        return PageMapper.toResponse(
                permissionRepository.findAll(PermissionSpecifications.from(filter), pageable),
                UserMapper::toPermissionResponse
        );
    }

    @Override
    public PermissionResponse getPermission(Long id) {
        return UserMapper.toPermissionResponse(findPermission(id));
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CacheConfig.PERMISSIONS_BY_NAME, allEntries = true)
    public PermissionResponse createPermission(CreatePermissionRequest request) {
        if (permissionRepository.existsByPermissionName(request.permissionName())) {
            throw new DuplicateResourceException("Permission already exists");
        }

        Permission permission = Permission.builder()
                .permissionName(request.permissionName())
                .description(request.description())
                .moduleName(request.moduleName())
                .build();

        return UserMapper.toPermissionResponse(permissionRepository.save(permission));
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CacheConfig.PERMISSIONS_BY_NAME, allEntries = true)
    public PermissionResponse updatePermission(Long id, UpdatePermissionRequest request) {
        Permission permission = findPermission(id);

        if (request.permissionName() != null
                && !request.permissionName().equals(permission.getPermissionName())) {
            if (permissionRepository.existsByPermissionName(request.permissionName())) {
                throw new DuplicateResourceException("Permission already exists");
            }
            permission.setPermissionName(request.permissionName());
        }

        if (request.description() != null) {
            permission.setDescription(request.description());
        }
        if (request.moduleName() != null) {
            permission.setModuleName(request.moduleName());
        }

        return UserMapper.toPermissionResponse(permissionRepository.save(permission));
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CacheConfig.PERMISSIONS_BY_NAME, allEntries = true)
    public void deletePermission(Long id) {
        Permission permission = findPermission(id);
        if (!permission.getRoles().isEmpty()) {
            throw new ResourceInUseException("Permission is assigned to one or more roles");
        }
        permissionRepository.delete(permission);
    }

    private Permission findPermission(Long id) {
        return permissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permission not found with id: " + id));
    }
}
