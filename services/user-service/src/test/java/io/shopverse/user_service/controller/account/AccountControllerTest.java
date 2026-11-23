package io.shopverse.user_service.controller.account;

import io.shopverse.user_service.dto.UserResponse;
import io.shopverse.user_service.entities.enums.UserStatus;
import io.shopverse.user_service.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Set;
import java.security.Principal;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AccountControllerTest {

    private MockMvc mockMvc;

    @Mock
    private UserService userService;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new AccountController(userService)).build();
    }

    @Test
    void getCurrentAccountUsesAuthenticatedUsernameAndKeepsExistingRoute() throws Exception {
        when(userService.loadAuthenticatedUserByUsername("ahmed")).thenReturn(userResponse());

        mockMvc.perform(get("/api/v1/users/me").principal((Principal) () -> "ahmed"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("ahmed"));

        verify(userService).loadAuthenticatedUserByUsername("ahmed");
    }

    @Test
    void getCurrentAccountSupportsCanonicalCurrentResourcePath() throws Exception {
        when(userService.loadAuthenticatedUserByUsername("ahmed")).thenReturn(userResponse());
        mockMvc.perform(get("/api/v1/accounts/current").principal((Principal) () -> "ahmed"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("ahmed"));
    }

    private static UserResponse userResponse() {
        return new UserResponse(
                1L,
                "user-uuid-1",
                "ahmed",
                "ahmed@example.com",
                "Ahmed",
                "Khan",
                "+919876543210",
                UserStatus.ACTIVE,
                Set.of()
        );
    }
}
