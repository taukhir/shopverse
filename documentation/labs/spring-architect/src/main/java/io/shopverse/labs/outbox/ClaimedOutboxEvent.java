package io.shopverse.labs.outbox;

import java.util.UUID;

public record ClaimedOutboxEvent(
        OutboxMessage message,
        UUID claimToken) {
}
