package io.shopverse.user_service.service.impl;

import io.shopverse.user_service.entities.User;
import io.shopverse.user_service.entities.UserAudit;
import io.shopverse.user_service.repository.UserAuditRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class UserAuditServiceImplTest {

    @Mock
    private UserAuditRepository userAuditRepository;

    private UserAuditServiceImpl userAuditService;

    @BeforeEach
    void setUp() {
        userAuditService = new UserAuditServiceImpl(userAuditRepository);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void recordUsesAuthenticatedActor() {
        User user = new User();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("admin", "password")
        );

        userAuditService.record(user, "USER_UPDATED", "Updated user");

        ArgumentCaptor<UserAudit> captor = ArgumentCaptor.forClass(UserAudit.class);
        verify(userAuditRepository).save(captor.capture());
        assertThat(captor.getValue().getUser()).isSameAs(user);
        assertThat(captor.getValue().getAction()).isEqualTo("USER_UPDATED");
        assertThat(captor.getValue().getPerformedBy()).isEqualTo("admin");
        assertThat(captor.getValue().getPerformedAt()).isNotNull();
    }

    @Test
    void recordFallsBackToSystemActor() {
        userAuditService.record(new User(), "USER_CREATED", "Created user");

        ArgumentCaptor<UserAudit> captor = ArgumentCaptor.forClass(UserAudit.class);
        verify(userAuditRepository).save(captor.capture());
        assertThat(captor.getValue().getPerformedBy()).isEqualTo("system");
    }
}
