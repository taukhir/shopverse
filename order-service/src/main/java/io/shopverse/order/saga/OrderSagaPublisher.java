package io.shopverse.order.saga;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.shopverse.order.config.KafkaTopicsProperties;
import io.shopverse.order.dto.OrderResponse;
import io.shopverse.order.observability.CorrelationContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderSagaPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final KafkaTopicsProperties topics;

    public CompletableFuture<Void> publishOrderCreated(OrderResponse order, String correlationId) {
        OrderCreatedEvent event = new OrderCreatedEvent(
                order.id(),
                order.orderNumber(),
                order.correlationId(),
                order.customerUsername(),
                order.items().getFirst().productId(),
                order.items().getFirst().quantity(),
                order.totalAmount()
        );

        try {
            String payload = objectMapper.writeValueAsString(event);
            log.info(
                    "Choreography saga publish scheduled orderNumber={} correlationId={} topic={} payload={}",
                    order.orderNumber(),
                    correlationId,
                    topics.orderCreated(),
                    payload
            );
            return kafkaTemplate.send(topics.orderCreated(), order.orderNumber(), payload)
                    .whenComplete((result, exception) ->
                            CorrelationContext.run(
                                    correlationId,
                                    () -> logPublishResult(order, correlationId, payload, result, exception)
                            )
                    )
                    .thenApply(result -> null);
        } catch (JsonProcessingException exception) {
            log.error(
                    "Unable to serialize order.created event orderNumber={} correlationId={}",
                    order.orderNumber(),
                    correlationId,
                    exception
            );
            return CompletableFuture.failedFuture(exception);
        }
    }

    private void logPublishResult(
            OrderResponse order,
            String correlationId,
            String payload,
            SendResult<String, String> result,
            Throwable exception
    ) {
        if (exception != null) {
            log.error(
                    "Choreography saga publish failed orderNumber={} correlationId={} topic={} payload={}",
                    order.orderNumber(),
                    correlationId,
                    topics.orderCreated(),
                    payload,
                    exception
            );
            return;
        }

        log.info(
                "Choreography saga event published orderNumber={} correlationId={} topic={} partition={} offset={}",
                order.orderNumber(),
                correlationId,
                result.getRecordMetadata().topic(),
                result.getRecordMetadata().partition(),
                result.getRecordMetadata().offset()
        );
    }
}
