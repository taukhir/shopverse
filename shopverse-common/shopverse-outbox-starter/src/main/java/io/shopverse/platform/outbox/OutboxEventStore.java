package io.shopverse.platform.outbox;

import java.time.Instant;
import java.util.List;

public interface OutboxEventStore {

    List<Long> pendingEventIds(int batchSize);

    OutboxMessage claim(Long eventId);

    void markPublished(Long eventId, KafkaPublishMetadata metadata);

    void markRetryableFailure(Long eventId, Throwable cause);

    void releaseStaleClaims(Instant claimedBefore, int batchSize);
}
