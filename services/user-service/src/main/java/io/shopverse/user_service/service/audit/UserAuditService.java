package io.shopverse.user_service.service.audit;

import io.shopverse.user_service.entities.User;

public interface UserAuditService {

    void record(User user, String action, String details);
}
