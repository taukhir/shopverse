package io.shopverse.platform.error;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

public record ApiErrorResponse(
        int status,
        String message,
        LocalDateTime timestamp,
        Map<String, String> errors
) {
    public ApiErrorResponse {
        errors = errors == null ? null : Collections.unmodifiableMap(new LinkedHashMap<>(errors));
    }
}
