package io.shopverse.user_service.service.impl;

import io.shopverse.user_service.entities.PasswordHistory;
import io.shopverse.user_service.entities.User;
import io.shopverse.user_service.exceptions.BadRequestException;
import io.shopverse.user_service.repository.PasswordHistoryRepository;
import io.shopverse.user_service.service.PasswordHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PasswordHistoryServiceImpl implements PasswordHistoryService {

    private final PasswordHistoryRepository passwordHistoryRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void ensurePasswordWasNotRecentlyUsed(User user, String rawPassword) {
        boolean recentlyUsed = passwordHistoryRepository.findTop5ByUserOrderByChangedAtDesc(user)
                .stream()
                .anyMatch(history -> passwordEncoder.matches(rawPassword, history.getPasswordHash()));

        if (recentlyUsed) {
            throw new BadRequestException("Password was used recently. Please choose a different password");
        }
    }

    @Override
    public void record(User user, String passwordHash) {
        passwordHistoryRepository.save(PasswordHistory.builder()
                .user(user)
                .passwordHash(passwordHash)
                .changedAt(LocalDateTime.now())
                .build());
    }
}
