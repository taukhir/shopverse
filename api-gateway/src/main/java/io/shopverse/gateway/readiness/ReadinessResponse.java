package io.shopverse.gateway.readiness;

import java.time.Instant;
import java.util.Map;

public record ReadinessResponse(
        String status,
        Instant checkedAt,
        long durationMs,
        Map<String, ReadinessCheck> checks
) {
}
