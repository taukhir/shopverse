package io.shopverse.gateway.readiness;

import java.util.Map;

public record ReadinessCheck(
        String status,
        String message,
        Map<String, Object> details
) {
    public static ReadinessCheck up(String message, Map<String, Object> details) {
        return new ReadinessCheck(ReadinessStatus.UP.name(), message, details == null ? Map.of() : details);
    }

    public static ReadinessCheck down(String message, Map<String, Object> details) {
        return new ReadinessCheck(ReadinessStatus.DOWN.name(), message, details == null ? Map.of() : details);
    }

    public static ReadinessCheck warn(String message, Map<String, Object> details) {
        return new ReadinessCheck(ReadinessStatus.WARN.name(), message, details == null ? Map.of() : details);
    }

    public boolean requiredReady() {
        return ReadinessStatus.UP.name().equals(status);
    }
}
