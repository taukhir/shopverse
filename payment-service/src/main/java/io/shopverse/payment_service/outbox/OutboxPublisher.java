package io.shopverse.payment_service.outbox;

import io.micrometer.core.instrument.MeterRegistry;
import io.shopverse.payment_service.observability.CorrelationContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
public class OutboxPublisher {
    private final OutboxEventRepository repository;
    private final PaymentOutboxPublishWorker worker;

    @Value("${shopverse.outbox.claim-timeout-ms:30000}")
    private long claimTimeoutMs;

    @Scheduled(fixedDelayString = "${shopverse.outbox.publish-delay-ms:1000}")
    public void publishPending() {
        worker.releaseStaleClaims(Instant.now().minusMillis(claimTimeoutMs));
        repository.findTop50ByStatusOrderByCreatedAtAsc(OutboxStatus.PENDING)
                .forEach(event -> worker.publish(event.getId()));
    }
}

@Slf4j
@Service
@RequiredArgsConstructor
class PaymentOutboxPublishWorker {
    private final OutboxEventRepository repository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final MeterRegistry meterRegistry;
    private final TransactionTemplate transactionTemplate;

    @Value("${shopverse.outbox.send-timeout-seconds:10}")
    private long sendTimeoutSeconds;

    public void publish(Long eventId) {
        OutboxMessage message = claim(eventId);
        if (message == null) {
            return;
        }
        CorrelationContext.run(message.correlationId(), () -> publishRecord(message));
    }

    private OutboxMessage claim(Long eventId) {
        return transactionTemplate.execute(status -> {
            OutboxEvent event = repository.findByIdForUpdate(eventId).orElse(null);
            if (event == null
                    || event.getStatus() != OutboxStatus.PENDING) {
                return null;
            }
            event.claim();
            return OutboxMessage.from(event);
        });
    }

    private void publishRecord(OutboxMessage message) {
        try {
            var result = kafkaTemplate.send(message.topic(), message.messageKey(), message.payload())
                    .get(sendTimeoutSeconds, TimeUnit.SECONDS);
            transactionTemplate.executeWithoutResult(status ->
                    repository.findByIdForUpdate(message.id())
                            .filter(event -> event.getStatus() == OutboxStatus.PROCESSING)
                            .ifPresent(OutboxEvent::markPublished)
            );
            meterRegistry.counter("shopverse.outbox.publish", "outcome", "success").increment();
            log.info("Outbox event published eventId={} eventType={} aggregateId={} topic={} partition={} offset={}",
                    message.id(), message.eventType(), message.aggregateId(),
                    result.getRecordMetadata().topic(), result.getRecordMetadata().partition(),
                    result.getRecordMetadata().offset());
        } catch (Exception exception) {
            transactionTemplate.executeWithoutResult(status ->
                    repository.findByIdForUpdate(message.id())
                            .filter(event -> event.getStatus() == OutboxStatus.PROCESSING)
                            .ifPresent(event -> event.markFailed(exception))
            );
            meterRegistry.counter("shopverse.outbox.publish", "outcome", "failed").increment();
            log.error("Outbox publish failed eventId={} eventType={} aggregateId={} topic={}",
                    message.id(), message.eventType(), message.aggregateId(), message.topic(), exception);
        }
    }

    public void releaseStaleClaims(Instant claimedBefore) {
        transactionTemplate.executeWithoutResult(status ->
                repository.findTop50ByStatusAndClaimedAtBeforeOrderByClaimedAtAsc(
                                OutboxStatus.PROCESSING,
                                claimedBefore
                        )
                        .forEach(OutboxEvent::releaseStaleClaim)
        );
    }
}

record OutboxMessage(
        Long id,
        String aggregateId,
        String eventType,
        String topic,
        String messageKey,
        String payload,
        String correlationId
) {
    static OutboxMessage from(OutboxEvent event) {
        return new OutboxMessage(
                event.getId(), event.getAggregateId(), event.getEventType(), event.getTopic(),
                event.getMessageKey(), event.getPayload(), event.getCorrelationId()
        );
    }
}
