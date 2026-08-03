package io.shopverse.labs.outbox;

import jakarta.persistence.EntityManager;
import java.time.Instant;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InboxTransactionProcessor {
    private final OrderProjectionRepository projections;
    private final EntityManager entityManager;

    public InboxTransactionProcessor(
            OrderProjectionRepository projections,
            EntityManager entityManager) {
        this.projections = projections;
        this.entityManager = entityManager;
    }

    @Transactional
    public void apply(String consumerName, OutboxMessage message) {
        entityManager.persist(new ProcessedEventEntity(
                new ProcessedEventId(consumerName, message.eventId()), Instant.now()));
        entityManager.flush();

        OrderProjectionEntity projection = projections.findById(message.aggregateId())
                .orElseGet(() -> new OrderProjectionEntity(
                        message.aggregateId(), 0, "NONE", Instant.EPOCH));
        projection.apply(message.aggregateVersion(), message.eventType(), Instant.now());
        projections.save(projection);
    }
}
