package io.shopverse.user_service.controller;

import io.shopverse.user_service.constants.ApiConstants;
import io.shopverse.user_service.dto.UserResponse;
import io.shopverse.user_service.service.UserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiConstants.INTERNAL_USERS)
@RequiredArgsConstructor
@Slf4j
@Tag(name = "InternalUsers", description = "Internal User account and password management APIs")
public class InternalUserController {

    private final UserService userService;

    @GetMapping("/username/{username}")
    public ResponseEntity<UserResponse> getUserByUsername(@PathVariable String username) {
        log.info("Internal user lookup requested by username: {}", username);
        return ResponseEntity.ok(userService.loadUserByUsername(username));
    }
}
