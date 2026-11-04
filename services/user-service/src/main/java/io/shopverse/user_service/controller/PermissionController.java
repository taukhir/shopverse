package io.shopverse.user_service.controller;

import io.shopverse.platform.web.pagination.PageResponse;
import io.shopverse.platform.web.pagination.PaginationUtils;
import io.shopverse.user_service.constants.ApiConstants;
import io.shopverse.user_service.dto.ApiResponse;
import io.shopverse.user_service.dto.PermissionResponse;
import io.shopverse.user_service.model.CreatePermissionRequest;
import io.shopverse.user_service.model.PermissionFilter;
import io.shopverse.user_service.model.UpdatePermissionRequest;
import io.shopverse.user_service.service.PermissionService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RestController
@RequestMapping(ApiConstants.PERMISSIONS)
@RequiredArgsConstructor
@Tag(name = "Permissions", description = "Permission management APIs")
public class PermissionController {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "id",
            "permissionName",
            "description",
            "moduleName",
            "createdAt"
    );

    private final PermissionService permissionService;

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN_ACCESS')")
    public ResponseEntity<PageResponse<PermissionResponse>> getPermissions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String moduleName
    ) {
        Pageable pageable = PaginationUtils.createPageable(
                page,
                size,
                sortBy,
                direction,
                ALLOWED_SORT_FIELDS
        );

        return ResponseEntity.ok(permissionService.getPermissions(
                new PermissionFilter(search, moduleName),
                pageable
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN_ACCESS')")
    public ResponseEntity<ApiResponse<PermissionResponse>> getPermission(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                "Permission fetched successfully",
                permissionService.getPermission(id)
        ));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN_ACCESS')")
    public ResponseEntity<ApiResponse<PermissionResponse>> createPermission(
            @Valid @RequestBody CreatePermissionRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        "Permission created successfully",
                        permissionService.createPermission(request)
                ));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN_ACCESS')")
    public ResponseEntity<ApiResponse<PermissionResponse>> updatePermission(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePermissionRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Permission updated successfully",
                permissionService.updatePermission(id, request)
        ));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN_ACCESS')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePermission(@PathVariable Long id) {
        permissionService.deletePermission(id);
    }
}
