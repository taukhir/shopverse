package io.shopverse.order.outbox;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class OutboxEventTest {

    @Test
    void claimAndPublishUseExplicitStates() {
        OutboxEvent event = event();

        event.claim();

        assertThat(event.getStatus()).isEqualTo(OutboxStatus.PROCESSING);
        assertThat(event.getClaimedAt()).isNotNull();
        assertThat(event.getPublishAttempts()).isOne();

        event.markPublished();

        assertThat(event.getStatus()).isEqualTo(OutboxStatus.PUBLISHED);
        assertThat(event.getClaimedAt()).isNull();
        assertThat(event.getPublishedAt()).isNotNull();
    }

    @Test
    void failedAndStaleClaimsReturnToPending() {
        OutboxEvent failed = event();
        failed.claim();
        failed.markFailed(new IllegalStateException("Kafka unavailable"));

        assertThat(failed.getStatus()).isEqualTo(OutboxStatus.PENDING);
        assertThat(failed.getClaimedAt()).isNull();
        assertThat(failed.getLastError()).isEqualTo("Kafka unavailable");

        OutboxEvent stale = event();
        stale.claim();
        stale.releaseStaleClaim();

        assertThat(stale.getStatus()).isEqualTo(OutboxStatus.PENDING);
        assertThat(stale.getClaimedAt()).isNull();
    }

    private static OutboxEvent event() {
        return new OutboxEvent(
                "ORDER",
                "ORD-1",
                "OrderCreatedEvent",
                "shopverse.order.created",
                "ORD-1",
                "{}",
                "correlation-1"
        );
    }
}
