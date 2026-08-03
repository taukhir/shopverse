package io.shopverse.labs.outbox;

@FunctionalInterface
public interface EventPublisher {
    void publish(OutboxMessage message);
}
