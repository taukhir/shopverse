package io.shopverse.order.outbox;

public enum OutboxStatus {
    PENDING,
    PROCESSING,
    PUBLISHED
}
