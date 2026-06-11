package io.shopverse.payment_service.service;

import io.shopverse.payment_service.dto.FailedKafkaEventResponse;
import io.shopverse.payment_service.entity.FailedKafkaEvent;
import io.shopverse.payment_service.exception.ResourceNotFoundException;
import io.shopverse.payment_service.repository.FailedKafkaEventRepository;
import lombok.RequiredArgsConstructor;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.shopverse.payment_service.outbox.OutboxService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import io.micrometer.core.instrument.MeterRegistry;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FailedKafkaEventService {

    private final FailedKafkaEventRepository repository;
    private final OutboxService outboxService;
    private final ObjectMapper objectMapper;
    private final MeterRegistry meterRegistry;

    @Transactional
    public void record(String topic, String payload, String reason, int retries) {
        repository.save(new FailedKafkaEvent(topic, payload, reason, retries));
        meterRegistry.counter("shopverse.kafka.dlt.events", "service", "payment").increment();
    }

    public List<FailedKafkaEventResponse> getAll() {
        return repository.findAllByOrderByFailedAtDesc().stream().map(this::toResponse).toList();
    }

    @Transactional
    public FailedKafkaEventResponse replay(Long id, String replayedBy) {
        FailedKafkaEvent event = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Failed Kafka event not found: " + id));
        String correlationId = readText(event.getPayload(), "correlationId", "replay-" + id);
        String messageKey = readText(event.getPayload(), "orderNumber", id.toString());
        outboxService.enqueue(
                "FAILED_KAFKA_EVENT",
                id.toString(),
                "KafkaEventReplay",
                event.getSourceTopic(),
                messageKey,
                readPayload(event.getPayload()),
                correlationId
        );
        event.markReplayed(replayedBy);
        meterRegistry.counter("shopverse.kafka.dlt.replays", "service", "payment").increment();
        return toResponse(event);
    }

    private Object readPayload(String payload) {
        try {
            return objectMapper.readTree(payload);
        } catch (Exception exception) {
            throw new IllegalStateException("Stored Kafka payload is not valid JSON", exception);
        }
    }

    private String readText(String payload, String field, String fallback) {
        try {
            return objectMapper.readTree(payload).path(field).asText(fallback);
        } catch (Exception exception) {
            return fallback;
        }
    }

    private FailedKafkaEventResponse toResponse(FailedKafkaEvent event) {
        return new FailedKafkaEventResponse(
                event.getId(),
                event.getSourceTopic(),
                event.getPayload(),
                event.getFailureReason(),
                event.getRetryCount(),
                event.isReplayed(),
                event.getReplayCount(),
                event.getLastReplayedBy(),
                event.getFailedAt(),
                event.getReplayedAt()
        );
    }
}
