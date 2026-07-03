package io.shopverse.user_service.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.shopverse.user_service.constants.ResilienceConstants;
import io.shopverse.user_service.dto.UserResponse;
import io.shopverse.user_service.entities.enums.UserStatus;
import io.shopverse.user_service.exceptions.GlobalExceptionHandler;
import io.shopverse.user_service.model.CreateUserRequest;
import io.shopverse.user_service.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import java.util.Set;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    private static final String USERS_PATH = "/api/v1/users";

    private MockMvc mockMvc;

    private ObjectMapper objectMapper;

    @Mock
    private UserService userService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper().findAndRegisterModules();

        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        mockMvc = MockMvcBuilders
                .standaloneSetup(new UserController(userService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setValidator(validator)
                .build();
    }

    @Test
    void getUserReturnsUserDetails() throws Exception {
        when(userService.getUser(1L)).thenReturn(userResponse());

        mockMvc.perform(get(USERS_PATH + "/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("User fetched successfully"))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.username").value("ahmed"))
                .andExpect(jsonPath("$.data.email").value("ahmed@example.com"))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));

        verify(userService).getUser(1L);
    }

    @Test
    void createUserReturnsCreatedUser() throws Exception {
        CreateUserRequest request = new CreateUserRequest(
                "ahmed",
                "ahmed@example.com",
                "Secure@123",
                "Ahmed",
                "Khan",
                "+919876543210",
                Set.of("CUSTOMER")
        );

        when(userService.createUser(any(CreateUserRequest.class))).thenReturn(userResponse());

        mockMvc.perform(post(USERS_PATH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("User created successfully"))
                .andExpect(jsonPath("$.data.username").value("ahmed"));

        verify(userService).createUser(any(CreateUserRequest.class));
    }

    @Test
    void createUserRejectsInvalidRequest() throws Exception {
        CreateUserRequest request = new CreateUserRequest(
                "a",
                "not-an-email",
                "weak",
                "Ahmed",
                "Khan",
                "123",
                Set.of("CUSTOMER")
        );

        mockMvc.perform(post(USERS_PATH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors.username", containsString("Username must be 3-50 characters")))
                .andExpect(jsonPath("$.errors.email").exists())
                .andExpect(jsonPath("$.errors.password").exists())
                .andExpect(jsonPath("$.errors.phoneNumber").exists());

        verify(userService, never()).createUser(any(CreateUserRequest.class));
    }

    @Test
    void userEndpointsUseAnnotationBasedResilience() throws Exception {
        RateLimiter rateLimiter = UserController.class.getAnnotation(RateLimiter.class);
        Bulkhead bulkhead = UserController.class.getAnnotation(Bulkhead.class);

        org.assertj.core.api.Assertions.assertThat(rateLimiter).isNotNull();
        org.assertj.core.api.Assertions.assertThat(rateLimiter.name())
                .isEqualTo(ResilienceConstants.API_RATE_LIMITER);
        org.assertj.core.api.Assertions.assertThat(bulkhead).isNotNull();
        org.assertj.core.api.Assertions.assertThat(bulkhead.name())
                .isEqualTo(ResilienceConstants.API_BULKHEAD);
        org.assertj.core.api.Assertions.assertThat(bulkhead.type())
                .isEqualTo(Bulkhead.Type.SEMAPHORE);
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
