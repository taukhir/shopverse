package io.shopverse.payment_service.service;

import io.shopverse.payment_service.dto.FailedKafkaEventResponse;
import io.shopverse.payment_service.entity.FailedKafkaEvent;
import io.shopverse.payment_service.exception.ResourceNotFoundException;
import io.shopverse.payment_service.repository.FailedKafkaEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FailedKafkaEventService {

    private final FailedKafkaEventRepository repository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    @Transactional
    public void record(String topic, String payload, String reason, int retries) {
        repository.save(new FailedKafkaEvent(topic, payload, reason, retries));
    }

    public List<FailedKafkaEventResponse> getAll() {
        return repository.findAllByOrderByFailedAtDesc().stream().map(this::toResponse).toList();
    }

    @Transactional
    public FailedKafkaEventResponse replay(Long id) {
        FailedKafkaEvent event = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Failed Kafka event not found: " + id));
        kafkaTemplate.send(event.getSourceTopic(), event.getPayload());
        event.markReplayed();
        return toResponse(event);
    }

    private FailedKafkaEventResponse toResponse(FailedKafkaEvent event) {
        return new FailedKafkaEventResponse(
                event.getId(),
                event.getSourceTopic(),
                event.getPayload(),
                event.getFailureReason(),
                event.getRetryCount(),
                event.isReplayed(),
                event.getFailedAt(),
                event.getReplayedAt()
        );
    }
}
