package io.shopverse.inventory_service.outbox;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class OutboxEventTest {

    @Test
    void claimAndCompletionReleaseTheClaim() {
        OutboxEvent event = event();

        event.claim();
        assertThat(event.getStatus()).isEqualTo(OutboxStatus.PROCESSING);
        assertThat(event.getClaimedAt()).isNotNull();

        event.markPublished();
        assertThat(event.getStatus()).isEqualTo(OutboxStatus.PUBLISHED);
        assertThat(event.getClaimedAt()).isNull();
    }

    @Test
    void failureReturnsTheEventToPending() {
        OutboxEvent event = event();
        event.claim();

        event.markFailed(new IllegalStateException("Kafka unavailable"));

        assertThat(event.getStatus()).isEqualTo(OutboxStatus.PENDING);
        assertThat(event.getClaimedAt()).isNull();
        assertThat(event.getPublishAttempts()).isOne();
    }

    private static OutboxEvent event() {
        return new OutboxEvent(
                "INVENTORY",
                "ORD-1",
                "InventoryReservedEvent",
                "shopverse.inventory.reserved",
                "ORD-1",
                "{}",
                "correlation-1"
        );
    }
}
