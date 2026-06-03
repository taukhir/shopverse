package io.shopverse.auth.service;

import io.shopverse.auth.dto.AuthResponse;
import io.shopverse.auth.dto.LoginRequest;
import io.shopverse.auth.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuthService {

    private final UserServiceClient userService;
    private final JwtService jwtService;

    public AuthResponse authenticate(LoginRequest req) {
        User user;

        try {
            log.info("Authenticating user through user service username={}", req.username());
            user = userService.authenticate(req.username(), req.password());
        } catch (Exception e) {
            log.warn("Authentication failed through user service username={}", req.username());
            throw new BadCredentialsException(
                    "Invalid username or password"
            );
        }

        log.info("Authentication successful username={}", req.username());
        return jwtService.generateToken(user);

    }

}
