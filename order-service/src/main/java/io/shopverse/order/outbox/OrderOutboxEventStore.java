package io.shopverse.order.outbox;

import io.shopverse.platform.outbox.KafkaPublishMetadata;
import io.shopverse.platform.outbox.OutboxEventStore;
import io.shopverse.platform.outbox.OutboxMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderOutboxEventStore implements OutboxEventStore {

    private final OutboxEventRepository repository;
    private final TransactionTemplate transactionTemplate;

    @Override
    public List<Long> pendingEventIds(int batchSize) {
        return repository.findTop50ByStatusOrderByCreatedAtAsc(OutboxStatus.PENDING)
                .stream()
                .limit(batchSize)
                .map(OutboxEvent::getId)
                .toList();
    }

    @Override
    public OutboxMessage claim(Long eventId) {
        return transactionTemplate.execute(status -> {
            OutboxEvent event = repository.findByIdForUpdate(eventId).orElse(null);
            if (event == null || event.getStatus() != OutboxStatus.PENDING) {
                return null;
            }
            event.claim();
            return toMessage(event);
        });
    }

    @Override
    public void markPublished(Long eventId, KafkaPublishMetadata metadata) {
        transactionTemplate.executeWithoutResult(status ->
                repository.findByIdForUpdate(eventId)
                        .filter(event -> event.getStatus() == OutboxStatus.PROCESSING)
                        .ifPresent(OutboxEvent::markPublished)
        );
    }

    @Override
    public void markRetryableFailure(Long eventId, Throwable cause) {
        transactionTemplate.executeWithoutResult(status ->
                repository.findByIdForUpdate(eventId)
                        .filter(event -> event.getStatus() == OutboxStatus.PROCESSING)
                        .ifPresent(event -> event.markFailed(cause))
        );
    }

    @Override
    public void releaseStaleClaims(Instant claimedBefore, int batchSize) {
        transactionTemplate.executeWithoutResult(status ->
                repository.findTop50ByStatusAndClaimedAtBeforeOrderByClaimedAtAsc(
                                OutboxStatus.PROCESSING,
                                claimedBefore
                        )
                        .stream()
                        .limit(batchSize)
                        .forEach(OutboxEvent::releaseStaleClaim)
        );
    }

    private OutboxMessage toMessage(OutboxEvent event) {
        return new OutboxMessage(
                event.getId(),
                event.getAggregateId(),
                event.getEventType(),
                event.getTopic(),
                event.getMessageKey(),
                event.getPayload(),
                event.getCorrelationId()
        );
    }
}
