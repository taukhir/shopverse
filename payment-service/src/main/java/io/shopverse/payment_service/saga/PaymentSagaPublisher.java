package io.shopverse.payment_service.saga;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.shopverse.payment_service.config.KafkaTopicsProperties;
import io.shopverse.payment_service.observability.CorrelationContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentSagaPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final KafkaTopicsProperties topics;

    public void publishCompleted(PaymentCompletedEvent event) {
        publish(
                topics.paymentCompleted(),
                event.orderNumber(),
                event,
                "Payment completed",
                event.correlationId()
        );
    }

    public void publishFailed(PaymentFailedEvent event) {
        publish(
                topics.paymentFailed(),
                event.orderNumber(),
                event,
                "Payment failed",
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
