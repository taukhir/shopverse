package io.shopverse.labs.kafka;

import java.util.UUID;

public record OrderCreatedEvent(UUID eventId, UUID orderId, String customerId) {
}
