package io.shopverse.platform.kafka.recovery;

public interface KafkaReplayOutbox {

    void enqueueReplay(
            FailedKafkaEventRecord failedEvent,
            Object payload,
            String messageKey,
            String correlationId
    );
}
