package io.shopverse.platform.outbox;

public record KafkaPublishMetadata(
        String topic,
        int partition,
        long offset
) {
}
