package io.shopverse.user_service.controller.admin;

import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.shopverse.platform.web.pagination.PageResponse;
import io.shopverse.platform.web.pagination.PaginationUtils;
import io.shopverse.user_service.constants.ApiConstants;
import io.shopverse.user_service.constants.ResilienceConstants;
import io.shopverse.user_service.dto.ApiResponse;
import io.shopverse.user_service.dto.UserResponse;
import io.shopverse.user_service.dto.UserSummaryResponse;
import io.shopverse.user_service.entities.enums.UserStatus;
import io.shopverse.user_service.model.ChangePasswordRequest;
import io.shopverse.user_service.model.CreateUserRequest;
import io.shopverse.user_service.model.ResetPasswordRequest;
import io.shopverse.user_service.model.UpdateUserRequest;
import io.shopverse.user_service.model.ReplaceUserRequest;
import io.shopverse.user_service.model.UserFilter;
import io.shopverse.user_service.service.admin.AdminUserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;

@RestController
@RequestMapping({ApiConstants.ADMIN_USERS, ApiConstants.USERS})
@RequiredArgsConstructor
@Slf4j
@Tag(name = "User Administration", description = "Administrative user and password management APIs")
@RateLimiter(name = ResilienceConstants.API_RATE_LIMITER)
@Bulkhead(name = ResilienceConstants.API_BULKHEAD, type = Bulkhead.Type.SEMAPHORE)
public class UserAdminController {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "id",
            "username",
            "email",
            "firstName",
            "lastName",
            "status",
            "createdAt"
    );

    private final AdminUserService adminUserService;

    @GetMapping
    @PreAuthorize("hasAuthority('USER_READ')")
    public ResponseEntity<PageResponse<UserSummaryResponse>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) String role
    ) {
        log.info(
                "User search requested page={}, size={}, sortPresent={}, directionPresent={}, searchPresent={}, statusPresent={}, rolePresent={}",
                page,
                size,
                sortBy != null && !sortBy.isBlank(),
                direction != null && !direction.isBlank(),
                search != null && !search.isBlank(),
                status != null,
                role != null && !role.isBlank()
        );

        Pageable pageable = PaginationUtils.createPageable(page, size, sortBy, direction, ALLOWED_SORT_FIELDS);
        return ResponseEntity.ok(adminUserService.getUsers(new UserFilter(search, status, role), pageable));
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasAuthority('USER_READ')")
    public ResponseEntity<ApiResponse<UserResponse>> getUser(@PathVariable Long userId) {
        log.info("User lookup requested by id: {}", userId);
        return ResponseEntity.ok(ApiResponse.success("User fetched successfully", adminUserService.getUser(userId)));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('USER_CREATE')")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(@Valid @RequestBody CreateUserRequest request) {
        log.info("User creation requested for username={}", request.username());
        UserResponse created = adminUserService.createUser(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .location(org.springframework.web.servlet.support.ServletUriComponentsBuilder.fromCurrentRequest()
                        .path("/{id}").buildAndExpand(created.id()).toUri())
                .body(ApiResponse.success("User created successfully", created));
    }

    @PatchMapping("/{userId}")
    @PreAuthorize("hasAuthority('USER_UPDATE')")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable Long userId,
            @Valid @RequestBody UpdateUserRequest request
    ) {
        log.info("User update requested for id: {}", userId);
        return ResponseEntity.ok(ApiResponse.success("User updated successfully", adminUserService.updateUser(userId, request)));
    }

    @PutMapping("/{userId}")
    @PreAuthorize("hasAuthority('USER_UPDATE')")
    public ResponseEntity<ApiResponse<UserResponse>> replaceUser(
            @PathVariable Long userId, @Valid @RequestBody ReplaceUserRequest request) {
        return ResponseEntity.ok(ApiResponse.success("User replaced successfully", adminUserService.replaceUser(userId, request)));
    }

    @PatchMapping("/{userId}/password")
    @PreAuthorize("hasAuthority('USER_UPDATE')")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @PathVariable Long userId,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        log.info("Password change requested for user id: {}", userId);
        adminUserService.changePassword(userId, request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{userId}/password/reset")
    @PreAuthorize("hasAuthority('USER_UPDATE')")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @PathVariable Long userId,
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        log.warn("Password reset requested for user id: {}", userId);
        adminUserService.resetPassword(userId, request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasAuthority('USER_DELETE')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable Long userId) {
        log.warn("User deletion requested for id: {}", userId);
        adminUserService.deleteUser(userId);
    }
}
