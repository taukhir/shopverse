package io.shopverse.user_service.controller;

import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.shopverse.platform.web.pagination.PageResponse;
import io.shopverse.platform.web.pagination.PaginationUtils;
import io.shopverse.user_service.constants.ApiConstants;
import io.shopverse.user_service.constants.ResilienceConstants;
import io.shopverse.user_service.dto.ApiResponse;
import io.shopverse.user_service.dto.UserAddressResponse;
import io.shopverse.user_service.dto.UserResponse;
import io.shopverse.user_service.dto.UserSummaryResponse;
import io.shopverse.user_service.entities.enums.UserStatus;
import io.shopverse.user_service.model.*;
import io.shopverse.user_service.service.UserAddressService;
import io.shopverse.user_service.service.UserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Set;
import java.util.List;

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
    private final UserAddressService userAddressService;

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

    @PutMapping("/me")
    public ResponseEntity<UserResponse> replaceCurrentUserProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        log.info("Authenticated profile replace requested for username={}", authentication.getName());
        return ResponseEntity.ok(userService.updateAuthenticatedUserProfile(authentication.getName(), request));
    }

    @GetMapping("/me/addresses")
    public ResponseEntity<List<UserAddressResponse>> getCurrentUserAddresses(Authentication authentication) {
        return ResponseEntity.ok(userAddressService.getAddresses(authentication.getName()));
    }

    @PostMapping("/me/addresses")
    public ResponseEntity<UserAddressResponse> createCurrentUserAddress(
            Authentication authentication,
            @Valid @RequestBody UserAddressRequest request
    ) {
        log.info("Authenticated address creation requested for username={}", authentication.getName());
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(userAddressService.createAddress(authentication.getName(), request));
    }

    @PutMapping("/me/addresses/{addressId}")
    public ResponseEntity<UserAddressResponse> updateCurrentUserAddress(
            Authentication authentication,
            @PathVariable Long addressId,
            @Valid @RequestBody UserAddressRequest request
    ) {
        log.info("Authenticated address update requested for username={} addressId={}", authentication.getName(), addressId);
        return ResponseEntity.ok(userAddressService.updateAddress(authentication.getName(), addressId, request));
    }

    @DeleteMapping("/me/addresses/{addressId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCurrentUserAddress(
            Authentication authentication,
            @PathVariable Long addressId
    ) {
        log.warn("Authenticated address deletion requested for username={} addressId={}", authentication.getName(), addressId);
        userAddressService.deleteAddress(authentication.getName(), addressId);
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
