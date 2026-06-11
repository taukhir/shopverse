package io.shopverse.order.dto;

import java.time.Instant;

public record OrderTimelineResponse(
        String orderNumber,
        String correlationId,
        String stage,
        String detail,
        Instant occurredAt
) {
}
