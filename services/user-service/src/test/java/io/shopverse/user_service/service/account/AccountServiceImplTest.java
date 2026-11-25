package io.shopverse.user_service.service.account;

import io.shopverse.user_service.dto.UserResponse;
import io.shopverse.user_service.entities.User;
import io.shopverse.user_service.entities.enums.UserStatus;
import io.shopverse.user_service.exceptions.DuplicateResourceException;
import io.shopverse.user_service.model.RegisterCustomerRequest;
import io.shopverse.user_service.model.UpdateProfileRequest;
import io.shopverse.user_service.repository.UserRepository;
import io.shopverse.user_service.service.audit.UserAuditService;
import io.shopverse.user_service.service.audit.UserAuditEventRecorder;
import io.shopverse.user_service.service.provisioning.UserProvisioningService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private UserAuditService userAuditService;
    @Mock private UserAuditEventRecorder auditEventRecorder;
    @Mock private UserProvisioningService userProvisioningService;

    private AccountServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AccountServiceImpl(userRepository, userAuditService, auditEventRecorder, userProvisioningService);
    }

    @Test
    void updateProfileUpdatesOnlyProvidedFields() {
        User user = User.builder().username("ahmed").email("ahmed@example.com")
                .firstName("Ahmed").lastName("Khan").status(UserStatus.ACTIVE).build();
        when(userRepository.findByUsername("ahmed")).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        UserResponse response = service.updateProfile("ahmed", new UpdateProfileRequest(
                null, "New", null, null));

        assertThat(response.firstName()).isEqualTo("New");
        assertThat(user.getLastName()).isEqualTo("Khan");
        verify(userAuditService).record(user, "USER_UPDATED", "User account updated");
    }

    @Test
    void updateProfileRejectsEmailAlreadyInUse() {
        User user = User.builder().username("ahmed").email("ahmed@example.com").build();
        when(userRepository.findByUsername("ahmed")).thenReturn(Optional.of(user));
        when(userRepository.existsByEmail("other@example.com")).thenReturn(true);

        assertThatThrownBy(() -> service.updateProfile("ahmed",
                new UpdateProfileRequest("other@example.com", null, null, null)))
                .isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    void registerCustomerDelegatesToProvisioning() {
        RegisterCustomerRequest request = new RegisterCustomerRequest("ahmed", "ahmed@example.com",
                "password123", "Ahmed", "Khan", null);
        UserResponse expected = new UserResponse(1L, "uuid", "ahmed", "ahmed@example.com",
                "Ahmed", "Khan", null, UserStatus.ACTIVE, Set.of());
        when(userProvisioningService.registerCustomer(request)).thenReturn(expected);

        assertThat(service.registerCustomer(request)).isEqualTo(expected);
        verify(userProvisioningService).registerCustomer(request);
    }
}
