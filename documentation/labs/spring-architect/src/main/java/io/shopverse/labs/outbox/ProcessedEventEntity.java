package io.shopverse.labs.outbox;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "processed_events")
public class ProcessedEventEntity {
    @EmbeddedId
    private ProcessedEventId id;
    private Instant processedAt;

    protected ProcessedEventEntity() {}

    public ProcessedEventEntity(ProcessedEventId id, Instant processedAt) {
        this.id = id;
        this.processedAt = processedAt;
    }
}
