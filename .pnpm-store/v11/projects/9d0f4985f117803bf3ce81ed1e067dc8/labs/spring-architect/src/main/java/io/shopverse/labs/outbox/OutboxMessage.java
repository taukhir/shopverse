package io.shopverse.labs.outbox;

import java.time.Instant;
import java.util.UUID;

public record OutboxMessage(
        UUID eventId,
        UUID aggregateId,
        long aggregateVersion,
        String eventType,
        String payload,
        Instant occurredAt) {

    static OutboxMessage from(OutboxEventEntity event) {
        return new OutboxMessage(
                event.getId(), event.getAggregateId(), event.getAggregateVersion(),
                event.getEventType(), event.getPayload(), event.getCreatedAt());
    }
}
