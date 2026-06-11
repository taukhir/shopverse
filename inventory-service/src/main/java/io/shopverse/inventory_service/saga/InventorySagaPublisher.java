package io.shopverse.inventory_service.saga;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.shopverse.inventory_service.config.KafkaTopicsProperties;
import io.shopverse.inventory_service.observability.CorrelationContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class InventorySagaPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final KafkaTopicsProperties topics;

    public void publishReserved(InventoryReservedEvent event) {
        publish(
                topics.inventoryReserved(),
                event.orderNumber(),
                event,
                "Inventory reserved",
                event.correlationId()
        );
    }

    public void publishFailed(InventoryFailedEvent event) {
        publish(
                topics.inventoryFailed(),
                event.orderNumber(),
                event,
                "Inventory failed",
                event.correlationId()
        );
    }

    private void publish(String topic, String key, Object event, String eventName, String correlationId) {
        try {
            String payload = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(topic, key, payload).whenComplete((result, exception) ->
                    CorrelationContext.run(correlationId, () -> {
                if (exception != null) {
                    log.error("{} event publish failed orderNumber={} correlationId={} topic={}",
                            eventName, key, correlationId, topic, exception);
                    return;
                }
                log.info("{} event published orderNumber={} correlationId={} topic={} partition={} offset={}",
                        eventName,
                        key,
                        correlationId,
                        result.getRecordMetadata().topic(),
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
                    }));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to serialize " + eventName + " event for order " + key, exception);
        }
    }
}
