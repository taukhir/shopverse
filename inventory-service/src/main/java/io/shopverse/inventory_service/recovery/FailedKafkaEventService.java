package io.shopverse.inventory_service.recovery;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.shopverse.inventory_service.exception.ResourceNotFoundException;
import io.shopverse.inventory_service.outbox.OutboxService;
import lombok.RequiredArgsConstructor;
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
        if (repository.existsBySourceTopicAndPayloadAndReplayedFalse(topic, payload)) {
            return;
        }
        repository.save(new FailedKafkaEvent(topic, payload, reason, retries));
        meterRegistry.counter("shopverse.kafka.dlt.events", "service", "inventory").increment();
    }

    public List<FailedKafkaEventResponse> getAll() {
        return repository.findAllByOrderByFailedAtDesc().stream().map(this::toResponse).toList();
    }

    @Transactional
    public FailedKafkaEventResponse replay(Long id, String username) {
        FailedKafkaEvent event = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Failed Kafka event not found: " + id));
        try {
            var payload = objectMapper.readTree(event.getPayload());
            outboxService.enqueue("FAILED_KAFKA_EVENT", id.toString(), "KafkaEventReplay",
                    event.getSourceTopic(), payload.path("orderNumber").asText(id.toString()),
                    payload, payload.path("correlationId").asText("replay-" + id));
        } catch (Exception exception) {
            throw new IllegalStateException("Stored Kafka payload is not valid JSON", exception);
        }
        event.markReplayed(username);
        meterRegistry.counter("shopverse.kafka.dlt.replays", "service", "inventory").increment();
        return toResponse(event);
    }

    private FailedKafkaEventResponse toResponse(FailedKafkaEvent event) {
        return new FailedKafkaEventResponse(
                event.getId(), event.getSourceTopic(), event.getPayload(), event.getFailureReason(),
                event.getRetryCount(), event.isReplayed(), event.getReplayCount(),
                event.getLastReplayedBy(), event.getFailedAt(), event.getReplayedAt());
    }
}
