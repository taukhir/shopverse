package io.shopverse.user_service.service.impl;

import io.shopverse.user_service.constants.SecurityConstants;
import io.shopverse.user_service.entities.User;
import io.shopverse.user_service.entities.UserAudit;
import io.shopverse.user_service.repository.UserAuditRepository;
import io.shopverse.user_service.service.UserAuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserAuditServiceImpl implements UserAuditService {

    private final UserAuditRepository userAuditRepository;

    @Override
    public void record(User user, String action, String details) {
        userAuditRepository.save(UserAudit.builder()
                .user(user)
                .action(action)
                .performedBy(currentActor())
                .performedAt(LocalDateTime.now())
                .details(details)
                .build());
    }

    private String currentActor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            return SecurityConstants.SYSTEM_ACTOR;
        }

        return authentication.getName();
    }
}
