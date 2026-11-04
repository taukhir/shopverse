package io.shopverse.user_service.controller;

import io.shopverse.platform.web.pagination.PageResponse;
import io.shopverse.platform.web.pagination.PaginationUtils;
import io.shopverse.user_service.constants.ApiConstants;
import io.shopverse.user_service.dto.AdminAuditEventResponse;
import io.shopverse.user_service.model.AdminAuditEventFilter;
import io.shopverse.user_service.service.AdminAuditEventService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;

@RestController
@RequestMapping(ApiConstants.ADMIN_AUDIT_EVENTS)
@RequiredArgsConstructor
@Tag(name = "Admin Audit Events", description = "Immutable administrative activity APIs")
public class AdminAuditEventController {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "id",
            "area",
            "actor",
            "result",
            "occurredAt"
    );

    private final AdminAuditEventService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('ADMIN_ACCESS')")
    public ResponseEntity<PageResponse<AdminAuditEventResponse>> getEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "occurredAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction,
            @RequestParam(required = false) String area,
            @RequestParam(required = false) String actor,
            @RequestParam(required = false) String result,
            @RequestParam(required = false) String search
    ) {
        Pageable pageable = PaginationUtils.createPageable(page, size, sortBy, direction, ALLOWED_SORT_FIELDS);
        return ResponseEntity.ok(service.getEvents(new AdminAuditEventFilter(area, actor, result, search), pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('ADMIN_ACCESS')")
    public ResponseEntity<AdminAuditEventResponse> getEvent(@PathVariable Long id) {
        return ResponseEntity.ok(service.getEvent(id));
    }
}
