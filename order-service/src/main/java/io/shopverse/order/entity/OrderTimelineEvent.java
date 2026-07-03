package io.shopverse.order.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Getter
@Entity
@Table(name = "order_timeline_events")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
/**
 * Immutable business history used for support, demos, and correlation with
 * Loki and Zipkin. Timeline rows are appended rather than updated.
 */
public class OrderTimelineEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 40)
    private String orderNumber;

    @Column(nullable = false, length = 64)
    private String correlationId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private OrderTimelineStage stage;

    @Column(nullable = false, length = 500)
    private String detail;

    @Column(nullable = false)
    private Instant occurredAt;

    public OrderTimelineEvent(
            String orderNumber,
            String correlationId,
            OrderTimelineStage stage,
            String detail
    ) {
        this.orderNumber = orderNumber;
        this.correlationId = correlationId;
        this.stage = stage;
        this.detail = detail;
        this.occurredAt = Instant.now();
    }
}
