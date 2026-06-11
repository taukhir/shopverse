package io.shopverse.inventory_service.outbox;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Getter
@Entity
@Table(name = "outbox_events")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OutboxEvent {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 80) private String aggregateType;
    @Column(nullable = false, length = 100) private String aggregateId;
    @Column(nullable = false, length = 120) private String eventType;
    @Column(nullable = false, length = 200) private String topic;
    @Column(nullable = false, length = 100) private String messageKey;
    @Column(nullable = false, columnDefinition = "TEXT") private String payload;
    @Column(nullable = false, length = 64) private String correlationId;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private OutboxStatus status;
    @Column(nullable = false) private int publishAttempts;
    @Column(nullable = false) private Instant createdAt;
    private Instant publishedAt;
    @Column(length = 1000) private String lastError;

    public OutboxEvent(String aggregateType, String aggregateId, String eventType, String topic,
                       String messageKey, String payload, String correlationId) {
        this.aggregateType = aggregateType;
        this.aggregateId = aggregateId;
        this.eventType = eventType;
        this.topic = topic;
        this.messageKey = messageKey;
        this.payload = payload;
        this.correlationId = correlationId;
        this.status = OutboxStatus.PENDING;
        this.createdAt = Instant.now();
    }

    public void markPublished() {
        status = OutboxStatus.PUBLISHED;
        publishedAt = Instant.now();
        lastError = null;
    }

    public void markFailed(Throwable exception) {
        publishAttempts++;
        String message = exception.getMessage();
        lastError = message == null ? exception.getClass().getSimpleName()
                : message.substring(0, Math.min(message.length(), 1000));
    }
}
