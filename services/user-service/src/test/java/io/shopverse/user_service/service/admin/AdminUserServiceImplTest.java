package io.shopverse.user_service.service.admin;

import io.shopverse.user_service.dto.UserResponse;
import io.shopverse.user_service.entities.User;
import io.shopverse.user_service.entities.Role;
import io.shopverse.user_service.entities.enums.UserStatus;
import io.shopverse.user_service.exceptions.ResourceNotFoundException;
import io.shopverse.user_service.model.ChangePasswordRequest;
import io.shopverse.user_service.model.CreateUserRequest;
import io.shopverse.user_service.model.ResetPasswordRequest;
import io.shopverse.user_service.model.UpdateUserRequest;
import io.shopverse.user_service.model.UserFilter;
import io.shopverse.user_service.repository.UserRepository;
import io.shopverse.user_service.service.lookup.LookupService;
import io.shopverse.user_service.service.credentials.PasswordHistoryService;
import io.shopverse.user_service.service.audit.UserAuditService;
import io.shopverse.user_service.service.audit.UserAuditEventRecorder;
import io.shopverse.user_service.service.provisioning.UserProvisioningService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private PasswordHistoryService passwordHistoryService;
    @Mock private UserAuditService userAuditService;
    @Mock private UserAuditEventRecorder auditEventRecorder;
    @Mock private LookupService lookupService;
    @Mock private UserProvisioningService userProvisioningService;

    private AdminUserServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AdminUserServiceImpl(userRepository, passwordEncoder, passwordHistoryService,
                userAuditService, auditEventRecorder, lookupService, userProvisioningService);
    }

    @Test
    void createUserDelegatesAccountProvisioning() {
        CreateUserRequest request = new CreateUserRequest("ahmed", "ahmed@example.com", "password123",
                "Ahmed", "Khan", null, Set.of("ADMIN"));
        UserResponse expected = new UserResponse(1L, "uuid", "ahmed", "ahmed@example.com",
                "Ahmed", "Khan", null, UserStatus.ACTIVE, Set.of());
        when(userProvisioningService.createUser(request)).thenReturn(expected);

        assertThat(service.createUser(request)).isEqualTo(expected);
        verify(userProvisioningService).createUser(request);
    }

    @Test
    void getUsersReturnsPagedSummaries() {
        User user = user(1L);
        when(userRepository.findAll(org.mockito.ArgumentMatchers.<org.springframework.data.jpa.domain.Specification<User>>any(),
                org.mockito.ArgumentMatchers.eq(PageRequest.of(0, 20))))
                .thenReturn(new PageImpl<>(List.of(user), PageRequest.of(0, 20), 1));
        when(userRepository.findAllWithAuthoritiesByIdIn(List.of(1L))).thenReturn(List.of(user));

        var result = service.getUsers(new UserFilter("ahmed", UserStatus.ACTIVE, "ADMIN"), PageRequest.of(0, 20));

        assertThat(result.totalElements()).isEqualTo(1);
        assertThat(result.content()).hasSize(1);
        assertThat(result.content().getFirst().username()).isEqualTo("ahmed");
    }

    @Test
    void updateUserChangesOnlySuppliedFields() {
        User user = user(7L);
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        UserResponse updated = service.updateUser(7L, new UpdateUserRequest(null, null, "New", null,
                null, null, false, null, null));

        assertThat(updated.firstName()).isEqualTo("New");
        assertThat(user.getLastName()).isEqualTo("Khan");
        assertThat(user.getEnabled()).isFalse();
        verify(userAuditService).record(user, "USER_UPDATED", "User account updated");
    }

    @Test
    void deleteUserSoftDeletesAndAudits() {
        User user = user(7L);
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        service.deleteUser(7L);

        assertThat(user.getStatus()).isEqualTo(UserStatus.DELETED);
        assertThat(user.getEnabled()).isFalse();
        assertThat(user.getAccountNonLocked()).isFalse();
        verify(userRepository).save(user);
        verify(userAuditService).record(user, "USER_DELETED", "User account soft deleted");
    }

    @Test
    void changePasswordChecksCurrentPasswordAndRecordsHistory() {
        User user = user(7L);
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Current@123", "secret")).thenReturn(true);
        when(passwordEncoder.matches("New@12345", "secret")).thenReturn(false);
        when(passwordEncoder.encode("New@12345")).thenReturn("new-hash");
        when(userRepository.save(user)).thenReturn(user);

        service.changePassword(7L, new ChangePasswordRequest("Current@123", "New@12345"));

        assertThat(user.getPassword()).isEqualTo("new-hash");
        verify(passwordHistoryService).ensurePasswordWasNotRecentlyUsed(user, "New@12345");
        verify(passwordHistoryService).record(user, "new-hash");
    }

    @Test
    void resetPasswordDoesNotRequireCurrentPassword() {
        User user = user(7L);
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Reset@12345", "secret")).thenReturn(false);
        when(passwordEncoder.encode("Reset@12345")).thenReturn("reset-hash");
        when(userRepository.save(user)).thenReturn(user);

        service.resetPassword(7L, new ResetPasswordRequest("Reset@12345"));

        assertThat(user.getPassword()).isEqualTo("reset-hash");
        verify(userAuditService).record(user, "PASSWORD_RESET", "User password reset by administrator");
    }

    @Test
    void getUserThrowsWhenUserIsMissing() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getUser(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User not found with id: 99");
    }

    private User user(Long id) {
        User user = User.builder().uuid("user-uuid").username("ahmed").email("ahmed@example.com")
                .password("secret").firstName("Ahmed").lastName("Khan").status(UserStatus.ACTIVE)
                .enabled(true).accountNonLocked(true).roles(Set.of(Role.builder().roleName("ADMIN").build())).build();
        user.setId(id);
        return user;
    }
}
