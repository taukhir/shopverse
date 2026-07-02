package io.shopverse.platform.kafka.recovery;

public class KafkaRecoveryException extends RuntimeException {
    public KafkaRecoveryException(String message, Throwable cause) {
        super(message, cause);
    }
}
