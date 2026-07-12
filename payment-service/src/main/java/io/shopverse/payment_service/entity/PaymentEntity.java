package io.shopverse.payment_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@Entity
@Table(name = "payments")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PaymentEntity extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String orderNumber;

    @Column(nullable = false, unique = true, length = 64)
    private String correlationId;

    @Column(nullable = false, length = 100)
    private String customerUsername;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PaymentStatus status;

    @Column(unique = true, length = 80)
    private String paymentReference;

    @Column(length = 500)
    private String failureReason;

    public PaymentEntity(String orderNumber, String correlationId, String customerUsername, BigDecimal amount) {
        this.orderNumber = orderNumber;
        this.correlationId = correlationId;
        this.customerUsername = customerUsername;
        this.amount = amount;
        this.status = PaymentStatus.PENDING;
    }

    public void authorize(String reference) {
        status = PaymentStatus.AUTHORIZED;
        paymentReference = reference;
        failureReason = null;
    }

    public void capture() {
        status = PaymentStatus.CAPTURED;
        failureReason = null;
    }

    public void decline(String reason) {
        status = PaymentStatus.DECLINED;
        failureReason = reason;
    }

    public void timeOut(String reason) {
        status = PaymentStatus.TIMED_OUT;
        failureReason = reason;
    }

    public void refund() {
        status = PaymentStatus.REFUNDED;
    }

    public void markPending() {
        status = PaymentStatus.PENDING;
        failureReason = null;
    }
}
