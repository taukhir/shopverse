package io.shopverse.platform.outbox;

import org.springframework.scheduling.annotation.Scheduled;

import java.time.Instant;

public class ShopverseOutboxPublisher {

    private final OutboxEventStore eventStore;
    private final ShopverseOutboxPublishWorker worker;
    private final OutboxPublisherProperties properties;

    public ShopverseOutboxPublisher(
            OutboxEventStore eventStore,
            ShopverseOutboxPublishWorker worker,
            OutboxPublisherProperties properties
    ) {
        this.eventStore = eventStore;
        this.worker = worker;
        this.properties = properties;
    }

    @Scheduled(fixedDelayString = "${shopverse.outbox.publish-delay-ms:1000}")
    public void publishPending() {
        eventStore.releaseStaleClaims(
                Instant.now().minus(properties.getClaimTimeout()),
                properties.getBatchSize()
        );
        eventStore.pendingEventIds(properties.getBatchSize())
                .forEach(worker::publish);
    }
}
