package io.shopverse.labs.outbox;

import java.time.Instant;

public final class OutboxRelay {
    private final OutboxClaimService claims;
    private final OutboxCompletionService completion;
    private final EventPublisher publisher;

    public OutboxRelay(
            OutboxClaimService claims,
            OutboxCompletionService completion,
            EventPublisher publisher) {
        this.claims = claims;
        this.completion = completion;
        this.publisher = publisher;
    }

    public RelayResult publishAvailable(int batchSize, Instant now) {
        int published = 0;
        int failed = 0;
        for (ClaimedOutboxEvent event : claims.claimBatch(batchSize, now)) {
            try {
                publisher.publish(event.message());
                if (completion.markPublished(
                        event.message().eventId(), event.claimToken(), Instant.now())) {
                    published++;
                } else {
                    failed++;
                }
            } catch (RuntimeException failure) {
                failed++;
            }
        }
        return new RelayResult(published, failed);
    }

    public record RelayResult(int published, int failed) {}
}
