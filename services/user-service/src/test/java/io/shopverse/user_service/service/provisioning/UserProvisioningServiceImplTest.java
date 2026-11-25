package io.shopverse.user_service.service.provisioning;

import io.shopverse.user_service.entities.Role;
import io.shopverse.user_service.entities.User;
import io.shopverse.user_service.entities.enums.UserStatus;
import io.shopverse.user_service.exceptions.DuplicateResourceException;
import io.shopverse.user_service.model.CreateUserRequest;
import io.shopverse.user_service.repository.UserRepository;
import io.shopverse.user_service.service.lookup.LookupService;
import io.shopverse.user_service.service.credentials.PasswordHistoryService;
import io.shopverse.user_service.service.audit.UserAuditService;
import io.shopverse.user_service.service.audit.UserAuditEventRecorder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserProvisioningServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private PasswordHistoryService passwordHistoryService;
    @Mock private UserAuditService userAuditService;
    @Mock private UserAuditEventRecorder auditEventRecorder;
    @Mock private LookupService lookupService;

    private UserProvisioningServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new UserProvisioningServiceImpl(userRepository, passwordEncoder, passwordHistoryService,
                userAuditService, auditEventRecorder, lookupService);
    }

    @Test
    void createUserEncodesPasswordAndRecordsAuditHistory() {
        Role adminRole = Role.builder().roleName("ADMIN").build();
        when(userRepository.existsByUsername("ahmed")).thenReturn(false);
        when(userRepository.existsByEmail("ahmed@example.com")).thenReturn(false);
        when(lookupService.findRoleByName("ADMIN")).thenReturn(adminRole);
        when(passwordEncoder.encode("Password@123")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });

        var response = service.createUser(new CreateUserRequest("ahmed", "AHMED@example.com", "Password@123",
                "Ahmed", "Khan", null, Set.of("ADMIN")));

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertThat(response.username()).isEqualTo("ahmed");
        assertThat(savedUser.getPassword()).isEqualTo("encoded-password");
        assertThat(savedUser.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(savedUser.getRoles()).contains(adminRole);
        verify(passwordHistoryService).record(savedUser, "encoded-password");
        verify(userAuditService).record(savedUser, "USER_CREATED", "User account created");
    }

    @Test
    void createUserRejectsDuplicateUsernameBeforePersisting() {
        when(userRepository.existsByUsername("ahmed")).thenReturn(true);

        assertThatThrownBy(() -> service.createUser(new CreateUserRequest("ahmed", "ahmed@example.com",
                "Password@123", null, null, null, Set.of())))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessage("Username already exists");

        verify(userRepository, never()).save(any(User.class));
    }
}
