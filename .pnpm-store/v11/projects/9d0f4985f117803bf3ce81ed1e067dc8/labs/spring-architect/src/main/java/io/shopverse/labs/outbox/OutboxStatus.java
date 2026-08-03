package io.shopverse.labs.outbox;

public enum OutboxStatus {
    PENDING,
    IN_FLIGHT,
    PUBLISHED
}
