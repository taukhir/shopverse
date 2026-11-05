package io.shopverse.gateway.readiness;

import java.time.Instant;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

public record ReadinessResponse(
        String status,
        Instant checkedAt,
        long durationMs,
        Map<String, ReadinessCheck> checks
) {
    public ReadinessResponse {
        checks = checks == null ? null : Collections.unmodifiableMap(new LinkedHashMap<>(checks));
    }

}
