package io.shopverse.inventory_service.outbox;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OutboxService {
    private final OutboxEventRepository repository;
    private final ObjectMapper objectMapper;

    @Transactional(propagation = Propagation.MANDATORY)
    public void enqueue(String aggregateType, String aggregateId, String eventType, String topic,
                        String messageKey, Object event, String correlationId) {
        try {
            repository.save(new OutboxEvent(aggregateType, aggregateId, eventType, topic, messageKey,
                    objectMapper.writeValueAsString(event), correlationId));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to serialize outbox event " + eventType, exception);
        }
    }
}
