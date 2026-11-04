package io.shopverse.inventory_service.recovery;

import io.shopverse.platform.kafka.recovery.FailedKafkaEventRecord;
import io.shopverse.platform.kafka.recovery.FailedKafkaEventStore;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class InventoryFailedKafkaEventStore implements FailedKafkaEventStore {

    private final FailedKafkaEventRepository repository;

    @Override
    public boolean existsUnreplayed(String sourceTopic, String payload) {
        return repository.existsBySourceTopicAndPayloadAndReplayedFalse(sourceTopic, payload);
    }

    @Override
    public void saveFailed(String sourceTopic, String payload, String reason, int retryCount) {
        repository.save(new FailedKafkaEvent(sourceTopic, payload, reason, retryCount));
    }

    @Override
    public List<FailedKafkaEventRecord> findAll() {
        return repository.findAllByOrderByFailedAtDesc().stream()
                .map(this::toRecord)
                .toList();
    }

    @Override
    public Optional<FailedKafkaEventRecord> findById(Long id) {
        return repository.findById(id).map(this::toRecord);
    }

    @Override
    public FailedKafkaEventRecord markReplayed(Long id, String replayedBy) {
        FailedKafkaEvent event = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Failed Kafka event not found: " + id));
        event.markReplayed(replayedBy);
        return toRecord(event);
    }

    private FailedKafkaEventRecord toRecord(FailedKafkaEvent event) {
        return new FailedKafkaEventRecord(
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
