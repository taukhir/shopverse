package io.shopverse.payment_service.dto;

import java.time.Instant;

public record FailedKafkaEventResponse(
        Long id,
        String sourceTopic,
        String payload,
        String failureReason,
        int retryCount,
        boolean replayed,
        Instant failedAt,
        Instant replayedAt
) {
}
