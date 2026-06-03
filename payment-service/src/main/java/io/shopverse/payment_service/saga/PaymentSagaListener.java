package io.shopverse.payment_service.saga;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentSagaListener {

    private static final BigDecimal DEMO_PAYMENT_LIMIT = new BigDecimal("10000.00");

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Value("${shopverse.kafka.topics.payment-completed}")
    private String paymentCompletedTopic;

    @Value("${shopverse.kafka.topics.payment-failed}")
    private String paymentFailedTopic;

    @KafkaListener(
            topics = "${shopverse.kafka.topics.inventory-reserved}",
            groupId = "${spring.application.name}"
    )
    public void onInventoryReserved(String payload) {
        try {
            InventoryReservedEvent event = objectMapper.readValue(payload, InventoryReservedEvent.class);
            log.info(
                    "Choreography saga payment step started orderNumber={} correlationId={} amount={}",
                    event.orderNumber(),
                    event.correlationId(),
                    event.amount()
            );

            if (event.amount().compareTo(DEMO_PAYMENT_LIMIT) > 0) {
                publishPaymentFailed(event, "Demo payment limit exceeded");
                return;
            }

            PaymentCompletedEvent completedEvent = new PaymentCompletedEvent(
                    event.orderId(),
                    event.orderNumber(),
                    event.correlationId(),
                    "PAY-" + event.orderNumber(),
                    event.amount()
            );
            String completedPayload = objectMapper.writeValueAsString(completedEvent);
            kafkaTemplate.send(paymentCompletedTopic, event.orderNumber(), completedPayload);
            log.info(
                    "Choreography saga payment completed orderNumber={} correlationId={} topic={} payload={}",
                    event.orderNumber(),
                    event.correlationId(),
                    paymentCompletedTopic,
                    completedPayload
            );
        } catch (Exception exception) {
            log.error("Unable to process inventory.reserved event payload={}", payload, exception);
        }
    }

    private void publishPaymentFailed(InventoryReservedEvent event, String reason) throws Exception {
        PaymentFailedEvent failedEvent = new PaymentFailedEvent(event.orderId(), event.orderNumber(), event.correlationId(), reason);
        String failedPayload = objectMapper.writeValueAsString(failedEvent);
        kafkaTemplate.send(paymentFailedTopic, event.orderNumber(), failedPayload);
        log.warn(
                "Choreography saga payment failed orderNumber={} correlationId={} topic={} reason={}",
                event.orderNumber(),
                event.correlationId(),
                paymentFailedTopic,
                reason
        );
    }
}
