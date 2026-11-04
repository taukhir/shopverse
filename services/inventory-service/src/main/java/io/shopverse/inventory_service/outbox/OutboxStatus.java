package io.shopverse.inventory_service.outbox;

public enum OutboxStatus {
    PENDING,
    PROCESSING,
    PUBLISHED
}
