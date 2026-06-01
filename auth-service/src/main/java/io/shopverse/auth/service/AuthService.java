package io.shopverse.auth.service;

import io.shopverse.auth.dto.AuthResponse;
import io.shopverse.auth.dto.LoginRequest;
import io.shopverse.auth.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuthService {

    private final UserServiceClient userService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;



    public AuthResponse authenticate(LoginRequest req) {
        User user;

        try {
            log.info("Loading user for authentication username={}", req.username());
            user = userService.loadByUsername(req.username());
        } catch (Exception e) {
            log.warn("Authentication failed because user lookup failed username={}", req.username());
            throw new BadCredentialsException(
                    "Invalid username or password"
            );
        }

        boolean passwordMatches =
                passwordEncoder.matches(
                        req.password(),
                        user.password()
                );

        if (!passwordMatches) {
            log.warn("Authentication failed because password did not match username={}", req.username());
            throw new BadCredentialsException(
                    "Invalid username or password"
            );
        }

        log.info("Authentication successful username={}", req.username());
        return jwtService.generateToken(user);

    }

}
