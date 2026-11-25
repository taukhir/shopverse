package io.shopverse.user_service.service.audit;

import io.shopverse.user_service.entities.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class UserAuditEventRecorder {

    private final AdminAuditEventService adminAuditEventService;

    public void record(User user, String action, String title, String message) {
        adminAuditEventService.record(
                "USERS",
                action,
                title,
                "SUCCESS",
                user.getStatus() == null ? null : user.getStatus().name(),
                message,
                message,
                "USER",
                String.valueOf(user.getId()),
                "/admin/users/" + user.getId(),
                Map.of("username", user.getUsername())
        );
    }
}
