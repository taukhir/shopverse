package io.shopverse.user_service.service;

import io.shopverse.user_service.dto.PageResponse;
import io.shopverse.user_service.dto.PermissionResponse;
import io.shopverse.user_service.model.CreatePermissionRequest;
import io.shopverse.user_service.model.PermissionFilter;
import io.shopverse.user_service.model.UpdatePermissionRequest;
import org.springframework.data.domain.Pageable;

public interface PermissionService {

    PageResponse<PermissionResponse> getPermissions(PermissionFilter filter, Pageable pageable);

    PermissionResponse getPermission(Long id);

    PermissionResponse createPermission(CreatePermissionRequest request);

    PermissionResponse updatePermission(Long id, UpdatePermissionRequest request);

    void deletePermission(Long id);
}
