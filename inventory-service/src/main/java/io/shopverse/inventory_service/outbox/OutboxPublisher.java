package io.shopverse.inventory_service.outbox;

import io.shopverse.inventory_service.observability.CorrelationContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.concurrent.TimeUnit;
import io.micrometer.core.instrument.MeterRegistry;

@Component
@RequiredArgsConstructor
public class OutboxPublisher {
    private final OutboxEventRepository repository;
    private final InventoryOutboxPublishWorker worker;

    @Scheduled(fixedDelayString = "${shopverse.outbox.publish-delay-ms:1000}")
    public void publishPending() {
        repository.findTop50ByStatusOrderByCreatedAtAsc(OutboxStatus.PENDING)
                .forEach(event -> worker.publish(event.getId()));
    }
}

@Slf4j
@Service
@RequiredArgsConstructor
class InventoryOutboxPublishWorker {
    private final OutboxEventRepository repository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final MeterRegistry meterRegistry;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void publish(Long eventId) {
        OutboxEvent event = repository.findByIdForUpdate(eventId).orElse(null);
        if (event == null || event.getStatus() != OutboxStatus.PENDING) return;
        CorrelationContext.run(event.getCorrelationId(), () -> {
            try {
                var result = kafkaTemplate.send(event.getTopic(), event.getMessageKey(), event.getPayload())
                        .get(10, TimeUnit.SECONDS);
                event.markPublished();
                meterRegistry.counter("shopverse.outbox.publish", "outcome", "success").increment();
                log.info("Outbox event published eventId={} eventType={} aggregateId={} topic={} partition={} offset={}",
                        event.getId(), event.getEventType(), event.getAggregateId(),
                        result.getRecordMetadata().topic(), result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            } catch (Exception exception) {
                event.markFailed(exception);
                meterRegistry.counter("shopverse.outbox.publish", "outcome", "failed").increment();
                log.error("Outbox publish failed eventId={} eventType={} aggregateId={} topic={} attempts={}",
                        event.getId(), event.getEventType(), event.getAggregateId(), event.getTopic(),
                        event.getPublishAttempts(), exception);
            }
        });
    }
}
