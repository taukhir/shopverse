package io.shopverse.user_service.service;

import io.shopverse.user_service.dto.PageResponse;
import io.shopverse.user_service.dto.RoleResponse;
import io.shopverse.user_service.model.CreateRoleRequest;
import io.shopverse.user_service.model.RoleFilter;
import io.shopverse.user_service.model.UpdateRoleRequest;
import org.springframework.data.domain.Pageable;

public interface RoleService {

    PageResponse<RoleResponse> getRoles(RoleFilter filter, Pageable pageable);

    RoleResponse getRole(Long id);

    RoleResponse createRole(CreateRoleRequest request);

    RoleResponse updateRole(Long id, UpdateRoleRequest request);

    void deleteRole(Long id);
}
