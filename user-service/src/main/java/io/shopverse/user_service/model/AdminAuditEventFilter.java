package io.shopverse.user_service.model;

public record AdminAuditEventFilter(
        String area,
        String actor,
        String result,
        String search
) {
}
