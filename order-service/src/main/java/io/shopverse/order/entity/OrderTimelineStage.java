package io.shopverse.order.entity;

public enum OrderTimelineStage {
    ORDER_CREATED,
    INVENTORY_RESERVED,
    INVENTORY_REJECTED,
    PAYMENT_PROCESSING,
    PAYMENT_COMPLETED,
    PAYMENT_FAILED,
    ORDER_CONFIRMED,
    ORDER_CANCELLED
}
