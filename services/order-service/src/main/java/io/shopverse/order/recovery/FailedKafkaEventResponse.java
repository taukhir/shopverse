package io.shopverse.order.recovery;

import java.time.Instant;

public record FailedKafkaEventResponse(
        Long id,
        String sourceTopic,
        String payload,
        String failureReason,
        int retryCount,
        boolean replayed,
        int replayCount,
        String lastReplayedBy,
        Instant failedAt,
        Instant replayedAt
) {
}
