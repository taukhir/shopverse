package io.shopverse.labs.outbox;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "order_event_projections")
public class OrderProjectionEntity {
    @Id
    private UUID orderId;
    private long aggregateVersion;
    private String lastEventType;
    private Instant updatedAt;

    protected OrderProjectionEntity() {}

    public OrderProjectionEntity(
            UUID orderId, long aggregateVersion,
            String lastEventType, Instant updatedAt) {
        this.orderId = orderId;
        this.aggregateVersion = aggregateVersion;
        this.lastEventType = lastEventType;
        this.updatedAt = updatedAt;
    }

    public void apply(long nextVersion, String eventType, Instant now) {
        if (nextVersion > aggregateVersion) {
            aggregateVersion = nextVersion;
            lastEventType = eventType;
            updatedAt = now;
        }
    }

    public UUID getOrderId() { return orderId; }
    public long getAggregateVersion() { return aggregateVersion; }
    public String getLastEventType() { return lastEventType; }
}
