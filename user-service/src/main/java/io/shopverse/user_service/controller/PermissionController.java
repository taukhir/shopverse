package io.shopverse.user_service.controller;

import io.shopverse.user_service.dto.ApiResponse;
import io.shopverse.user_service.dto.PageResponse;
import io.shopverse.user_service.dto.PermissionResponse;
import io.shopverse.user_service.constants.ApiConstants;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.shopverse.user_service.model.CreatePermissionRequest;
import io.shopverse.user_service.model.PermissionFilter;
import io.shopverse.user_service.model.UpdatePermissionRequest;
import io.shopverse.user_service.service.PermissionService;
import io.shopverse.user_service.util.PaginationUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<ApiResponse<PermissionResponse>> getPermission(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                "Permission fetched successfully",
                permissionService.getPermission(id)
        ));
    }

    @PostMapping
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
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePermission(@PathVariable Long id) {
        permissionService.deletePermission(id);
    }
}
