package io.shopverse.security.service;

import io.shopverse.security.dto.AuthResponse;
import io.shopverse.security.dto.LoginRequest;
import io.shopverse.security.model.Role;
import io.shopverse.security.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import java.util.stream.Collectors;

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
            user = userService.loadByUsername(req.username());
        } catch (Exception e) {
            log.error(e.getMessage());
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
            log.error("Wrong password");
            throw new BadCredentialsException(
                    "Invalid username or password"
            );
        }

        return jwtService.generateToken(user);

    }

}
