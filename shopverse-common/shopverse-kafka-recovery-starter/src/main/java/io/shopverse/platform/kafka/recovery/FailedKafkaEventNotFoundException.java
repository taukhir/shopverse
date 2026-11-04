package io.shopverse.platform.kafka.recovery;

public class FailedKafkaEventNotFoundException extends RuntimeException {
    public FailedKafkaEventNotFoundException(Long id) {
        super("Failed Kafka event not found: " + id);
    }
}
