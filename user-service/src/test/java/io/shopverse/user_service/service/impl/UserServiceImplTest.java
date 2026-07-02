package io.shopverse.user_service.service.impl;

import io.shopverse.platform.web.pagination.PageResponse;
import io.shopverse.user_service.dto.UserResponse;
import io.shopverse.user_service.dto.UserSummaryResponse;
import io.shopverse.user_service.entities.Role;
import io.shopverse.user_service.entities.User;
import io.shopverse.user_service.entities.enums.UserStatus;
import io.shopverse.user_service.exceptions.DuplicateResourceException;
import io.shopverse.user_service.exceptions.ResourceNotFoundException;
import io.shopverse.user_service.model.*;
import io.shopverse.user_service.repository.UserRepository;
import io.shopverse.user_service.service.LookupService;
import io.shopverse.user_service.service.PasswordHistoryService;
import io.shopverse.user_service.service.UserAuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private LookupService lookupService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private PasswordHistoryService passwordHistoryService;

    @Mock
    private UserAuditService userAuditService;

    private UserServiceImpl userService;

    @BeforeEach
    void setUp() {
        userService = new UserServiceImpl(
                userRepository,
                passwordEncoder,
                passwordHistoryService,
                userAuditService,
                lookupService
        );
    }

    @Test
    void getUsersReturnsPagedUserSummaries() {
        User user = user(1L, "ahmed", "ahmed@example.com");
        when(userRepository.findAll(any(Specification.class), eq(PageRequest.of(0, 20))))
                .thenReturn(new PageImpl<>(List.of(user), PageRequest.of(0, 20), 1));

        PageResponse<UserSummaryResponse> response = userService.getUsers(
                new UserFilter("ahmed", UserStatus.ACTIVE, "ADMIN"),
                PageRequest.of(0, 20)
        );

        assertThat(response.totalElements()).isEqualTo(1);
        assertThat(response.content()).hasSize(1);
        assertThat(response.content().getFirst().username()).isEqualTo("ahmed");
        assertThat(response.content().getFirst().roles()).containsExactly("ADMIN");
    }

    @Test
    void getUserReturnsUserDetails() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L, "ahmed", "ahmed@example.com")));

        UserResponse response = userService.getUser(1L);

        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.username()).isEqualTo("ahmed");
        assertThat(response.roles()).hasSize(1);
    }

    @Test
    void getUserThrowsWhenUserDoesNotExist() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUser(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User not found with id: 99");
    }

    @Test
    void createUserHashesPasswordAndAssignsRoles() {
        Role admin = role(1L, "ADMIN");
        when(userRepository.existsByUsername("ahmed")).thenReturn(false);
        when(userRepository.existsByEmail("ahmed@example.com")).thenReturn(false);
        when(lookupService.findRoleByName("ADMIN")).thenReturn(admin);
        when(passwordEncoder.encode("password123")).thenReturn("hashed-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });

        UserResponse response = userService.createUser(new CreateUserRequest(
                "ahmed",
                "ahmed@example.com",
                "password123",
                "Ahmed",
                "Khan",
                "9999999999",
                Set.of("ADMIN")
        ));

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());

        assertThat(response.id()).isEqualTo(1L);
        assertThat(userCaptor.getValue().getPassword()).isEqualTo("hashed-password");
        assertThat(userCaptor.getValue().getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(userCaptor.getValue().getRoles()).containsExactly(admin);
        verify(passwordHistoryService).record(userCaptor.getValue(), "hashed-password");
        verify(userAuditService).record(userCaptor.getValue(), "USER_CREATED", "User account created");
    }

    @Test
    void createUserThrowsWhenUsernameAlreadyExists() {
        when(userRepository.existsByUsername("ahmed")).thenReturn(true);

        assertThatThrownBy(() -> userService.createUser(new CreateUserRequest(
                "ahmed",
                "ahmed@example.com",
                "password123",
                null,
                null,
                null,
                Set.of()
        )))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessage("Username already exists");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void updateUserUpdatesOnlyProvidedFields() {
        User user = user(1L, "ahmed", "ahmed@example.com");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(userRepository.save(user)).thenReturn(user);

        UserResponse response = userService.updateUser(1L, new UpdateUserRequest(
                null,
                "new@example.com",
                "New",
                null,
                null,
                UserStatus.INACTIVE,
                false,
                null,
                null
        ));

        assertThat(response.email()).isEqualTo("new@example.com");
        assertThat(response.firstName()).isEqualTo("New");
        assertThat(response.lastName()).isEqualTo("Khan");
        assertThat(user.getEnabled()).isFalse();
        assertThat(user.getAccountNonLocked()).isTrue();
    }

    @Test
    void updateUserThrowsWhenRoleDoesNotExist() {
        User user = user(1L, "ahmed", "ahmed@example.com");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(lookupService.findRoleByName("MISSING"))
                .thenThrow(new ResourceNotFoundException("Role not found: MISSING"));

        assertThatThrownBy(() -> userService.updateUser(1L, new UpdateUserRequest(
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                Set.of("MISSING")
        )))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Role not found: MISSING");
    }

    @Test
    void deleteUserDeletesExistingUser() {
        User user = user(1L, "ahmed", "ahmed@example.com");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        userService.deleteUser(1L);

        assertThat(user.getStatus()).isEqualTo(UserStatus.DELETED);
        assertThat(user.getEnabled()).isFalse();
        assertThat(user.getAccountNonLocked()).isFalse();
        verify(userRepository).save(user);
        verify(userRepository, never()).delete(any(User.class));
        verify(userAuditService).record(user, "USER_DELETED", "User account soft deleted");
    }

    @Test
    void changePasswordValidatesCurrentPasswordAndRecordsHistory() {
        User user = user(1L, "ahmed", "ahmed@example.com");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Current@123", "secret")).thenReturn(true);
        when(passwordEncoder.matches("New@12345", "secret")).thenReturn(false);
        when(passwordEncoder.encode("New@12345")).thenReturn("new-hash");
        when(userRepository.save(user)).thenReturn(user);

        userService.changePassword(1L, new ChangePasswordRequest("Current@123", "New@12345"));

        assertThat(user.getPassword()).isEqualTo("new-hash");
        verify(passwordHistoryService).ensurePasswordWasNotRecentlyUsed(user, "New@12345");
        verify(passwordHistoryService).record(user, "new-hash");
        verify(userAuditService).record(user, "PASSWORD_CHANGED", "User password changed");
    }

    @Test
    void resetPasswordDoesNotRequireCurrentPassword() {
        User user = user(1L, "ahmed", "ahmed@example.com");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Reset@12345", "secret")).thenReturn(false);
        when(passwordEncoder.encode("Reset@12345")).thenReturn("reset-hash");
        when(userRepository.save(user)).thenReturn(user);

        userService.resetPassword(1L, new ResetPasswordRequest("Reset@12345"));

        assertThat(user.getPassword()).isEqualTo("reset-hash");
        verify(userAuditService).record(user, "PASSWORD_RESET", "User password reset by administrator");
    }

    private User user(Long id, String username, String email) {
        User user = User.builder()
                .uuid("user-uuid")
                .username(username)
                .email(email)
                .password("secret")
                .firstName("Ahmed")
                .lastName("Khan")
                .phoneNumber("9999999999")
                .status(UserStatus.ACTIVE)
                .enabled(true)
                .accountNonLocked(true)
                .roles(Set.of(role(1L, "ADMIN")))
                .build();
        user.setId(id);
        return user;
    }

    private Role role(Long id, String roleName) {
        Role role = Role.builder()
                .roleName(roleName)
                .description(roleName + " role")
                .permissions(Set.of())
                .users(Set.of())
                .build();
        role.setId(id);
        return role;
    }
}
