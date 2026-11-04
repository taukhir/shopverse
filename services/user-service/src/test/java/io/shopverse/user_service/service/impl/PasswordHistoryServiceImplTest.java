package io.shopverse.user_service.service.impl;

import io.shopverse.user_service.entities.PasswordHistory;
import io.shopverse.user_service.entities.User;
import io.shopverse.user_service.exceptions.BadRequestException;
import io.shopverse.user_service.repository.PasswordHistoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PasswordHistoryServiceImplTest {

    @Mock
    private PasswordHistoryRepository passwordHistoryRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private PasswordHistoryServiceImpl passwordHistoryService;

    @BeforeEach
    void setUp() {
        passwordHistoryService = new PasswordHistoryServiceImpl(passwordHistoryRepository, passwordEncoder);
    }

    @Test
    void ensurePasswordWasNotRecentlyUsedPassesForNewPassword() {
        User user = new User();
        PasswordHistory history = PasswordHistory.builder().passwordHash("old-hash").build();
        when(passwordHistoryRepository.findTop5ByUserOrderByChangedAtDesc(user)).thenReturn(List.of(history));
        when(passwordEncoder.matches("New@12345", "old-hash")).thenReturn(false);

        passwordHistoryService.ensurePasswordWasNotRecentlyUsed(user, "New@12345");

        verify(passwordEncoder).matches("New@12345", "old-hash");
    }

    @Test
    void ensurePasswordWasNotRecentlyUsedThrowsForRecentPassword() {
        User user = new User();
        PasswordHistory history = PasswordHistory.builder().passwordHash("old-hash").build();
        when(passwordHistoryRepository.findTop5ByUserOrderByChangedAtDesc(user)).thenReturn(List.of(history));
        when(passwordEncoder.matches("Old@12345", "old-hash")).thenReturn(true);

        assertThatThrownBy(() -> passwordHistoryService.ensurePasswordWasNotRecentlyUsed(user, "Old@12345"))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Password was used recently. Please choose a different password");
    }

    @Test
    void recordPersistsPasswordHistory() {
        User user = new User();

        passwordHistoryService.record(user, "new-hash");

        ArgumentCaptor<PasswordHistory> captor = ArgumentCaptor.forClass(PasswordHistory.class);
        verify(passwordHistoryRepository).save(captor.capture());
        assertThat(captor.getValue().getUser()).isSameAs(user);
        assertThat(captor.getValue().getPasswordHash()).isEqualTo("new-hash");
        assertThat(captor.getValue().getChangedAt()).isNotNull();
    }
}
