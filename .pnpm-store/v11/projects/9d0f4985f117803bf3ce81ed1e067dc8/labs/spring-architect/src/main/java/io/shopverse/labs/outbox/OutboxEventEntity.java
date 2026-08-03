package io.shopverse.labs.outbox;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "outbox_events")
public class OutboxEventEntity {
    @Id
    private UUID id;
    private UUID aggregateId;
    private long aggregateVersion;
    private String eventType;
    private String payload;
    private Instant createdAt;
    @Enumerated(EnumType.STRING)
    private OutboxStatus status;
    private UUID claimToken;
    private Instant claimedAt;
    private Instant publishedAt;
    private int attempts;
    @Version
    private long rowVersion;

    protected OutboxEventEntity() {}

    public OutboxEventEntity(
            UUID id, UUID aggregateId, long aggregateVersion,
            String eventType, String payload, Instant createdAt) {
        this.id = id;
        this.aggregateId = aggregateId;
        this.aggregateVersion = aggregateVersion;
        this.eventType = eventType;
        this.payload = payload;
        this.createdAt = createdAt;
        this.status = OutboxStatus.PENDING;
    }

    public UUID getId() { return id; }
    public UUID getAggregateId() { return aggregateId; }
    public long getAggregateVersion() { return aggregateVersion; }
    public String getEventType() { return eventType; }
    public String getPayload() { return payload; }
    public Instant getCreatedAt() { return createdAt; }
    public OutboxStatus getStatus() { return status; }
    public UUID getClaimToken() { return claimToken; }
    public Instant getClaimedAt() { return claimedAt; }
    public Instant getPublishedAt() { return publishedAt; }
    public int getAttempts() { return attempts; }
}
