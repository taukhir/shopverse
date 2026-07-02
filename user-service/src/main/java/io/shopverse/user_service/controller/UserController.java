package io.shopverse.user_service.controller;

import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.shopverse.user_service.dto.ApiResponse;
import io.shopverse.platform.web.pagination.PageResponse;
import io.shopverse.user_service.dto.UserResponse;
import io.shopverse.user_service.dto.UserSummaryResponse;
import io.shopverse.user_service.entities.enums.UserStatus;
import io.shopverse.user_service.constants.ApiConstants;
import io.shopverse.user_service.constants.ResilienceConstants;
import io.shopverse.user_service.model.ChangePasswordRequest;
import io.shopverse.user_service.model.CreateUserRequest;
import io.shopverse.user_service.model.ResetPasswordRequest;
import io.shopverse.user_service.model.UpdateProfileRequest;
import io.shopverse.user_service.model.UpdateUserRequest;
import io.shopverse.user_service.model.UserFilter;
import io.shopverse.user_service.service.UserService;
import io.shopverse.platform.web.pagination.PaginationUtils;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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
@RequestMapping(ApiConstants.USERS)
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Users", description = "User account and password management APIs")
@RateLimiter(name = ResilienceConstants.API_RATE_LIMITER)
@Bulkhead(name = ResilienceConstants.API_BULKHEAD, type = Bulkhead.Type.SEMAPHORE)
public class UserController {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "id",
            "username",
            "email",
            "firstName",
            "lastName",
            "status",
            "createdAt"
    );

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Authentication authentication) {
        return ResponseEntity.ok(userService.loadAuthenticatedUserByUsername(authentication.getName()));
    }

    @PatchMapping("/me")
    public ResponseEntity<UserResponse> updateCurrentUser(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        log.info("Authenticated profile update requested for username={}", authentication.getName());
        return ResponseEntity.ok(userService.updateAuthenticatedUserProfile(authentication.getName(), request));
    }

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
                "User search requested page={}, size={}, sortBy={}, direction={}, searchPresent={}, status={}, role={}",
                page,
                size,
                sortBy,
                direction,
                search != null && !search.isBlank(),
                status,
                role
        );

        Pageable pageable = PaginationUtils.createPageable(
                page,
                size,
                sortBy,
                direction,
                ALLOWED_SORT_FIELDS
        );

        return ResponseEntity.ok(userService.getUsers(
                new UserFilter(search, status, role),
                pageable
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_READ')")
    public ResponseEntity<ApiResponse<UserResponse>> getUser(@PathVariable Long id) {
        log.info("User lookup requested by id: {}", id);
        return ResponseEntity.ok(ApiResponse.success("User fetched successfully", userService.getUser(id)));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('USER_CREATE')")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(@Valid @RequestBody CreateUserRequest request) {
        log.info("User creation requested for username={}, email={}", request.username(), request.email());
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("User created successfully", userService.createUser(request)));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_UPDATE')")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request
    ) {
        log.info("User update requested for id: {}", id);
        return ResponseEntity.ok(ApiResponse.success("User updated successfully", userService.updateUser(id, request)));
    }

    @PatchMapping("/{id}/password")
    @PreAuthorize("hasAuthority('USER_UPDATE')")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @PathVariable Long id,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        log.info("Password change requested for user id: {}", id);
        userService.changePassword(id, request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }

    @PostMapping("/{id}/password/reset")
    @PreAuthorize("hasAuthority('USER_UPDATE')")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @PathVariable Long id,
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        log.warn("Password reset requested for user id: {}", id);
        userService.resetPassword(id, request);
        return ResponseEntity.ok(ApiResponse.success("Password reset successfully", null));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_DELETE')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable Long id) {
        log.warn("User deletion requested for id: {}", id);
        userService.deleteUser(id);
    }

}
