package io.shopverse.payment_service.service;

import io.shopverse.payment_service.dto.FailedKafkaEventResponse;
import io.shopverse.payment_service.exception.ResourceNotFoundException;
import io.shopverse.platform.kafka.recovery.FailedKafkaEventNotFoundException;
import io.shopverse.platform.kafka.recovery.FailedKafkaEventRecord;
import io.shopverse.platform.kafka.recovery.KafkaRecoveryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FailedKafkaEventService {

    private final KafkaRecoveryService recoveryService;

    @Transactional
    public void record(String topic, String payload, String reason, int retries) {
        recoveryService.record(topic, payload, reason, retries);
    }

    public List<FailedKafkaEventResponse> getAll() {
        return recoveryService.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public FailedKafkaEventResponse replay(Long id, String replayedBy) {
        try {
            return toResponse(recoveryService.replay(id, replayedBy));
        } catch (FailedKafkaEventNotFoundException exception) {
            throw new ResourceNotFoundException(exception.getMessage());
        }
    }

    private FailedKafkaEventResponse toResponse(FailedKafkaEventRecord event) {
        return new FailedKafkaEventResponse(
                event.id(),
                event.sourceTopic(),
                event.payload(),
                event.failureReason(),
                event.retryCount(),
                event.replayed(),
                event.replayCount(),
                event.lastReplayedBy(),
                event.failedAt(),
                event.replayedAt()
        );
    }
}
