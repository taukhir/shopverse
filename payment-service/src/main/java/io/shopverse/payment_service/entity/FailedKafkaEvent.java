package io.shopverse.payment_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Getter
@Entity
@Table(name = "failed_kafka_events")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FailedKafkaEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String sourceTopic;

    @Lob
    @Column(nullable = false)
    private String payload;

    @Column(nullable = false, length = 500)
    private String failureReason;

    @Column(nullable = false)
    private int retryCount;

    @Column(nullable = false)
    private boolean replayed;

    @Column(nullable = false)
    private Instant failedAt;

    private Instant replayedAt;

    public FailedKafkaEvent(String sourceTopic, String payload, String failureReason, int retryCount) {
        this.sourceTopic = sourceTopic;
        this.payload = payload;
        this.failureReason = failureReason;
        this.retryCount = retryCount;
        this.failedAt = Instant.now();
    }

    public void markReplayed() {
        replayed = true;
        replayedAt = Instant.now();
    }
}
