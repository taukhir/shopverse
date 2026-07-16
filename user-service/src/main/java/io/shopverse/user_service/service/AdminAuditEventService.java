package io.shopverse.user_service.service;

import io.shopverse.platform.web.pagination.PageResponse;
import io.shopverse.user_service.dto.AdminAuditEventResponse;
import io.shopverse.user_service.model.AdminAuditEventFilter;
import org.springframework.data.domain.Pageable;

import java.util.Map;

public interface AdminAuditEventService {

    PageResponse<AdminAuditEventResponse> getEvents(AdminAuditEventFilter filter, Pageable pageable);

    AdminAuditEventResponse getEvent(Long id);

    void record(
            String area,
            String action,
            String title,
            String result,
            String status,
            String message,
            String description,
            String subjectType,
            String subjectId,
            String link,
            Map<String, Object> metadata
    );
}
