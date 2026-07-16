package io.shopverse.user_service.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.shopverse.platform.web.pagination.PageMapper;
import io.shopverse.platform.web.pagination.PageResponse;
import io.shopverse.user_service.constants.SecurityConstants;
import io.shopverse.user_service.dto.AdminAuditEventResponse;
import io.shopverse.user_service.entities.AdminAuditEvent;
import io.shopverse.user_service.exceptions.ResourceNotFoundException;
import io.shopverse.user_service.model.AdminAuditEventFilter;
import io.shopverse.user_service.repository.AdminAuditEventRepository;
import io.shopverse.user_service.repository.specification.AdminAuditEventSpecifications;
import io.shopverse.user_service.service.AdminAuditEventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AdminAuditEventServiceImpl implements AdminAuditEventService {

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };

    private final AdminAuditEventRepository repository;
    private final ObjectMapper objectMapper;

    @Override
    public PageResponse<AdminAuditEventResponse> getEvents(AdminAuditEventFilter filter, Pageable pageable) {
        return PageMapper.toResponse(
                repository.findAll(AdminAuditEventSpecifications.from(filter), pageable),
                this::toResponse
        );
    }

    @Override
    public AdminAuditEventResponse getEvent(Long id) {
        return repository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Audit event not found with id: " + id));
    }

    @Override
    @Transactional
    public void record(
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
    ) {
        try {
            repository.save(AdminAuditEvent.builder()
                    .area(area)
                    .action(action)
                    .title(title)
                    .actor(currentActor())
                    .result(result)
                    .status(status)
                    .message(message)
                    .description(description)
                    .occurredAt(LocalDateTime.now())
                    .subjectType(subjectType)
                    .subjectId(subjectId)
                    .link(link)
                    .metadata(metadata == null || metadata.isEmpty() ? null : objectMapper.writeValueAsString(metadata))
                    .build());
        } catch (JsonProcessingException ex) {
            log.warn("Admin audit metadata could not be serialized for action={}", action, ex);
        }
    }

    private AdminAuditEventResponse toResponse(AdminAuditEvent event) {
        return new AdminAuditEventResponse(
                event.getId(),
                event.getArea(),
                event.getAction(),
                event.getTitle(),
                event.getActor(),
                event.getResult(),
                event.getStatus(),
                event.getMessage(),
                event.getDescription(),
                event.getOccurredAt(),
                event.getSubjectType(),
                event.getSubjectId(),
                event.getLink(),
                readMetadata(event.getMetadata())
        );
    }

    private Map<String, Object> readMetadata(String metadata) {
        if (metadata == null || metadata.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(metadata, MAP_TYPE);
        } catch (JsonProcessingException ex) {
            log.warn("Admin audit metadata could not be parsed", ex);
            return Map.of("raw", metadata);
        }
    }

    private String currentActor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            return SecurityConstants.SYSTEM_ACTOR;
        }
        return authentication.getName();
    }
}
