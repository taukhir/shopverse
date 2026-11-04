package io.shopverse.user_service.dto;

import java.time.LocalDateTime;
import java.util.Map;

public record AdminAuditEventResponse(
        Long id,
        String area,
        String action,
        String title,
        String actor,
        String result,
        String status,
        String message,
        String description,
        LocalDateTime occurredAt,
        String subjectType,
        String subjectId,
        String link,
        Map<String, Object> metadata
) {
}
