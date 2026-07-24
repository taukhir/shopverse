package io.shopverse.labs.outbox;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProcessedEventRepository
        extends JpaRepository<ProcessedEventEntity, ProcessedEventId> {
}
