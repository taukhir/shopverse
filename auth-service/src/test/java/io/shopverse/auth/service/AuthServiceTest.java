package io.shopverse.auth.service;

import feign.FeignException;
import feign.RetryableException;
import io.shopverse.auth.dto.AuthResponse;
import io.shopverse.auth.dto.LoginRequest;
import io.shopverse.auth.exceptions.AuthenticationServiceUnavailableException;
import io.shopverse.auth.model.User;
import io.shopverse.auth.model.enums.UserStatus;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserServiceClient userServiceClient;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    @Test
    void authenticatesAndReturnsToken() {
        LoginRequest request = new LoginRequest("ahmed", "secret");
        User user = new User(
                1L,
                "user-uuid",
                "ahmed",
                "ahmed@example.com",
                "Ahmed",
                "Khan",
                null,
                UserStatus.ACTIVE,
                Set.of()
        );
        AuthResponse expected = new AuthResponse("signed-token");

        when(userServiceClient.authenticate(request.username(), request.password())).thenReturn(user);
        when(jwtService.generateToken(user)).thenReturn(expected);

        AuthResponse response = authService.authenticate(request);

        assertThat(response).isEqualTo(expected);
        verify(jwtService).generateToken(user);
    }

    @Test
    void rejectsInvalidCredentials() {
        LoginRequest request = new LoginRequest("ahmed", "wrong");
        when(userServiceClient.authenticate(request.username(), request.password()))
                .thenThrow(mock(FeignException.Unauthorized.class));

        assertThatThrownBy(() -> authService.authenticate(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid username or password");
    }

    @Test
    void reportsUserServiceOutage() {
        LoginRequest request = new LoginRequest("ahmed", "secret");
        when(userServiceClient.authenticate(request.username(), request.password()))
                .thenThrow(mock(RetryableException.class));

        assertThatThrownBy(() -> authService.authenticate(request))
                .isInstanceOf(AuthenticationServiceUnavailableException.class)
                .hasMessage("Authentication service is temporarily unavailable");
    }
}
