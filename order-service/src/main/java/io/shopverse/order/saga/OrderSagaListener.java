package io.shopverse.order.saga;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderSagaListener {

    private final ObjectMapper objectMapper;

    @KafkaListener(
            topics = "${shopverse.kafka.topics.inventory-failed}",
            groupId = "${spring.application.name}"
    )
    public void onInventoryFailed(String payload) {
        try {
            InventoryFailedEvent event = objectMapper.readValue(payload, InventoryFailedEvent.class);
            log.warn(
                    "Choreography saga cancelled orderNumber={} reason={} nextAction=MARK_ORDER_REJECTED",
                    event.orderNumber(),
                    event.reason()
            );
        } catch (Exception exception) {
            log.error("Unable to process inventory.failed event payload={}", payload, exception);
        }
    }

    @KafkaListener(
            topics = "${shopverse.kafka.topics.payment-completed}",
            groupId = "${spring.application.name}"
    )
    public void onPaymentCompleted(String payload) {
        try {
            PaymentCompletedEvent event = objectMapper.readValue(payload, PaymentCompletedEvent.class);
            log.info(
                    "Choreography saga completed orderNumber={} paymentReference={} amount={} nextAction=MARK_ORDER_CONFIRMED",
                    event.orderNumber(),
                    event.paymentReference(),
                    event.amount()
            );
        } catch (Exception exception) {
            log.error("Unable to process payment.completed event payload={}", payload, exception);
        }
    }

    @KafkaListener(
            topics = "${shopverse.kafka.topics.payment-failed}",
            groupId = "${spring.application.name}"
    )
    public void onPaymentFailed(String payload) {
        try {
            PaymentFailedEvent event = objectMapper.readValue(payload, PaymentFailedEvent.class);
            log.warn(
                    "Choreography saga cancelled orderNumber={} reason={} nextAction=MARK_ORDER_PAYMENT_FAILED",
                    event.orderNumber(),
                    event.reason()
            );
        } catch (Exception exception) {
            log.error("Unable to process payment.failed event payload={}", payload, exception);
        }
    }
}
