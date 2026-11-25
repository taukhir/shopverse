package io.shopverse.user_service.controller.admin;

import io.shopverse.platform.web.pagination.PageResponse;
import io.shopverse.platform.web.pagination.PaginationUtils;
import io.shopverse.user_service.constants.ApiConstants;
import io.shopverse.user_service.dto.ApiResponse;
import io.shopverse.user_service.dto.RoleResponse;
import io.shopverse.user_service.model.CreateRoleRequest;
import io.shopverse.user_service.model.RoleFilter;
import io.shopverse.user_service.model.UpdateRoleRequest;
import io.shopverse.user_service.service.access.RoleService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;

@RestController
@RequestMapping(ApiConstants.ROLES)
@RequiredArgsConstructor
@Tag(name = "Roles", description = "Role management APIs")
@PreAuthorize("hasAuthority('ADMIN_ACCESS')")
public class RoleController {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "id",
            "roleName",
            "description",
            "createdAt"
    );

    private final RoleService roleService;

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN_ACCESS')")
    public ResponseEntity<PageResponse<RoleResponse>> getRoles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String permission
    ) {
        Pageable pageable = PaginationUtils.createPageable(
                page,
                size,
                sortBy,
                direction,
                ALLOWED_SORT_FIELDS
        );

        return ResponseEntity.ok(roleService.getRoles(
                new RoleFilter(search, permission),
                pageable
        ));
    }

    @GetMapping("/{roleId}")
    @PreAuthorize("hasAuthority('ADMIN_ACCESS')")
    public ResponseEntity<ApiResponse<RoleResponse>> getRole(@PathVariable Long roleId) {
        return ResponseEntity.ok(ApiResponse.success("Role fetched successfully", roleService.getRole(roleId)));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN_ACCESS')")
    public ResponseEntity<ApiResponse<RoleResponse>> createRole(@Valid @RequestBody CreateRoleRequest request) {
        RoleResponse created = roleService.createRole(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .location(org.springframework.web.servlet.support.ServletUriComponentsBuilder.fromCurrentRequest()
                        .path("/{roleId}").buildAndExpand(created.id()).toUri())
                .body(ApiResponse.success("Role created successfully", created));
    }

    @PatchMapping("/{roleId}")
    @PreAuthorize("hasAuthority('ADMIN_ACCESS')")
    public ResponseEntity<ApiResponse<RoleResponse>> updateRole(
            @PathVariable Long roleId,
            @Valid @RequestBody UpdateRoleRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Role updated successfully", roleService.updateRole(roleId, request)));
    }

    @DeleteMapping("/{roleId}")
    @PreAuthorize("hasAuthority('ADMIN_ACCESS')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRole(@PathVariable Long roleId) {
        roleService.deleteRole(roleId);
    }
}
