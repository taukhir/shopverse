package io.shopverse.labs.outbox;

import java.time.Duration;
import java.time.Instant;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OutboxReconciliationService {
    private final OutboxEventRepository outbox;

    public OutboxReconciliationService(OutboxEventRepository outbox) {
        this.outbox = outbox;
    }

    @Transactional(readOnly = true)
    public OutboxHealth snapshot(Instant now) {
        long pending = outbox.countByStatus(OutboxStatus.PENDING);
        long inFlight = outbox.countByStatus(OutboxStatus.IN_FLIGHT);
        long published = outbox.countByStatus(OutboxStatus.PUBLISHED);
        Duration oldestPendingAge = outbox
                .findFirstByStatusOrderByCreatedAtAsc(OutboxStatus.PENDING)
                .map(event -> Duration.between(event.getCreatedAt(), now))
                .orElse(Duration.ZERO);
        return new OutboxHealth(pending, inFlight, published, oldestPendingAge);
    }

    public record OutboxHealth(
            long pending,
            long inFlight,
            long published,
            Duration oldestPendingAge) {
    }
}
