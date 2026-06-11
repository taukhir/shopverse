package io.shopverse.inventory_service.entity;

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

import java.time.Instant;
import java.time.Duration;

@Getter
@Entity
@Table(name = "inventory_reservations")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class InventoryReservation extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String orderNumber;

    @Column(nullable = false, length = 64)
    private String correlationId;

    @Column(nullable = false)
    private Long productId;

    @Column(nullable = false)
    private int quantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReservationStatus status;

    @Column(nullable = false)
    private Instant expiresAt;

    public InventoryReservation(
            String orderNumber,
            String correlationId,
            Long productId,
            int quantity,
            Duration reservationTtl
    ) {
        this.orderNumber = orderNumber;
        this.correlationId = correlationId;
        this.productId = productId;
        this.quantity = quantity;
        this.status = ReservationStatus.RESERVED;
        this.expiresAt = Instant.now().plus(reservationTtl);
    }

    public void release() {
        status = ReservationStatus.RELEASED;
    }

    public void expire() {
        status = ReservationStatus.EXPIRED;
    }
}
