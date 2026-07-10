package io.shopverse.user_service.controller;

import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.shopverse.user_service.constants.ApiConstants;
import io.shopverse.user_service.constants.ResilienceConstants;
import io.shopverse.user_service.dto.UserResponse;
import io.shopverse.user_service.model.RegisterCustomerRequest;
import io.shopverse.user_service.service.UserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiConstants.PUBLIC_API + "/users")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Public Registration", description = "Customer self-registration APIs")
@RateLimiter(name = ResilienceConstants.API_RATE_LIMITER)
@Bulkhead(name = ResilienceConstants.API_BULKHEAD, type = Bulkhead.Type.SEMAPHORE)
public class PublicRegistrationController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<UserResponse> registerCustomer(@Valid @RequestBody RegisterCustomerRequest request) {
        log.info("Public customer registration requested for username={}, email={}", request.username(), request.email());
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(userService.registerCustomer(request));
    }
}
