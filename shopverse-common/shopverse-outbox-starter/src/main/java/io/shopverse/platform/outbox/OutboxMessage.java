package io.shopverse.platform.outbox;

public record OutboxMessage(
        Long id,
        String aggregateId,
        String eventType,
        String topic,
        String messageKey,
        String payload,
        String correlationId
) {
}
