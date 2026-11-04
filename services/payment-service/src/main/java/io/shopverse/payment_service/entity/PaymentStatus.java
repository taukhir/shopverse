package io.shopverse.payment_service.entity;

public enum PaymentStatus {
    PENDING,
    AUTHORIZED,
    CAPTURED,
    DECLINED,
    TIMED_OUT,
    REFUNDED
}
