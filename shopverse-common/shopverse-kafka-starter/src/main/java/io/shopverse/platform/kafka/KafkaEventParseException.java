package io.shopverse.platform.kafka;

public class KafkaEventParseException extends RuntimeException {

    private final String payload;
    private final Class<?> eventType;

    public KafkaEventParseException(String payload, Class<?> eventType, Throwable cause) {
        super("Invalid Kafka event payload for " + eventType.getSimpleName(), cause);
        this.payload = payload;
        this.eventType = eventType;
    }

    public String getPayload() {
        return payload;
    }

    public Class<?> getEventType() {
        return eventType;
    }
}
