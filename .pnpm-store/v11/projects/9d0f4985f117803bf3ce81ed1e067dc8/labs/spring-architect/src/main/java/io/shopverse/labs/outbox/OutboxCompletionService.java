package io.shopverse.labs.outbox;

import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OutboxCompletionService {
    private final OutboxEventRepository outbox;

    public OutboxCompletionService(OutboxEventRepository outbox) {
        this.outbox = outbox;
    }

    @Transactional
    public boolean markPublished(UUID eventId, UUID claimToken, Instant publishedAt) {
        return outbox.markPublished(eventId, claimToken, publishedAt) == 1;
    }
}
