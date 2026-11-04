package io.shopverse.platform.kafka;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

public class KafkaEventParser {

    private final ObjectMapper objectMapper;

    public KafkaEventParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public <T> T parse(String payload, Class<T> eventType) {
        try {
            return objectMapper.readValue(payload, eventType);
        } catch (JsonProcessingException exception) {
            throw new KafkaEventParseException(payload, eventType, exception);
        }
    }
}
