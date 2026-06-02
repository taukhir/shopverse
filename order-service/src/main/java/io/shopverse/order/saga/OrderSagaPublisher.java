package io.shopverse.order.saga;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.shopverse.order.dto.OrderResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderSagaPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Value("${shopverse.kafka.topics.order-created}")
    private String orderCreatedTopic;

    public void publishOrderCreated(OrderResponse order) {
        OrderCreatedEvent event = new OrderCreatedEvent(
                order.id(),
                order.orderNumber(),
                order.customerUsername(),
                order.items().getFirst().productId(),
                order.items().getFirst().quantity(),
                order.totalAmount()
        );

        try {
            String payload = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(orderCreatedTopic, order.orderNumber(), payload);
            log.info(
                    "Choreography saga started orderNumber={} topic={} payload={}",
                    order.orderNumber(),
                    orderCreatedTopic,
                    payload
            );
        } catch (JsonProcessingException exception) {
            log.error("Unable to publish order.created event orderNumber={}", order.orderNumber(), exception);
        }
    }
}
