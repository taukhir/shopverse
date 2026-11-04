package io.shopverse.auth.service;

import feign.FeignException;
import feign.RetryableException;
import io.shopverse.auth.dto.AuthResponse;
import io.shopverse.auth.dto.LoginRequest;
import io.shopverse.auth.exceptions.AuthenticationServiceUnavailableException;
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
        } catch (FeignException.Unauthorized | FeignException.Forbidden exception) {
            log.warn("Authentication failed through user service username={}", req.username());
            throw new BadCredentialsException("Invalid username or password", exception);
        } catch (RetryableException exception) {
            log.error("User service unavailable during authentication username={}", req.username(), exception);
            throw new AuthenticationServiceUnavailableException(
                    "Authentication service is temporarily unavailable",
                    exception
            );
        } catch (FeignException exception) {
            log.error(
                    "User service authentication call failed username={} status={}",
                    req.username(),
                    exception.status(),
                    exception
            );
            throw new AuthenticationServiceUnavailableException(
                    "Authentication service is temporarily unavailable",
                    exception
            );
        }

        log.info("Authentication successful username={}", req.username());
        return jwtService.generateToken(user);
    }
}
