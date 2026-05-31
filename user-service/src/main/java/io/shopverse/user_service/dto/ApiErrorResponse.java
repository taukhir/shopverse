package io.shopverse.user_service.dto;

import java.time.LocalDateTime;
import java.util.Map;

public record ApiErrorResponse(

        int status,

        String message,

        LocalDateTime timestamp,

        Map<String, String> errors

) {
}
