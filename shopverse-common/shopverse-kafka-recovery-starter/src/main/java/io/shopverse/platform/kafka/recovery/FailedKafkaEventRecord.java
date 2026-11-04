package io.shopverse.platform.kafka.recovery;

import java.time.Instant;

public record FailedKafkaEventRecord(
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
