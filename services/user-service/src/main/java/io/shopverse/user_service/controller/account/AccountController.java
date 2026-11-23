package io.shopverse.user_service.controller.account;

import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.shopverse.user_service.constants.ApiConstants;
import io.shopverse.user_service.constants.ResilienceConstants;
import io.shopverse.user_service.dto.UserResponse;
import io.shopverse.user_service.model.UpdateProfileRequest;
import io.shopverse.user_service.service.UserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping({ApiConstants.CURRENT_ACCOUNT, ApiConstants.ACCOUNTS + "/me", ApiConstants.USERS + "/me"})
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Accounts", description = "Authenticated customer account APIs")
@RateLimiter(name = ResilienceConstants.API_RATE_LIMITER)
@Bulkhead(name = ResilienceConstants.API_BULKHEAD, type = Bulkhead.Type.SEMAPHORE)
public class AccountController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<UserResponse> getCurrentAccount(Principal principal) {
        return ResponseEntity.ok(userService.loadAuthenticatedUserByUsername(principal.getName()));
    }

    @PatchMapping
    public ResponseEntity<UserResponse> updateCurrentAccount(
            Principal principal,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        log.info("Authenticated account update requested for username={}", principal.getName());
        return ResponseEntity.ok(userService.updateAuthenticatedUserProfile(principal.getName(), request));
    }

}
