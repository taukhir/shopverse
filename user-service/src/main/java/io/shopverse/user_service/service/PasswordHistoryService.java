package io.shopverse.user_service.service;

import io.shopverse.user_service.entities.User;

public interface PasswordHistoryService {

    void ensurePasswordWasNotRecentlyUsed(User user, String rawPassword);

    void record(User user, String passwordHash);
}
