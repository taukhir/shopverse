package io.shopverse.payment_service.saga;

import io.shopverse.platform.kafka.KafkaEventParser;
import io.shopverse.platform.observability.CorrelationContext;
import io.shopverse.payment_service.config.KafkaTopicsProperties;
import io.shopverse.payment_service.service.FailedKafkaEventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.annotation.RetryableTopic;
import org.springframework.kafka.annotation.DltHandler;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentSagaListener {

    private final KafkaEventParser eventParser;
    private final PaymentSagaTransactionService sagaTransactionService;
    private final FailedKafkaEventService failedKafkaEventService;
    private final KafkaTopicsProperties topics;

    @RetryableTopic(attempts = "3")
    @KafkaListener(
            topics = "${shopverse.kafka.topics.inventory-reserved}",
            groupId = "${spring.application.name}"
    )
    public void onInventoryReserved(String payload) {
        InventoryReservedEvent event = eventParser.parse(payload, InventoryReservedEvent.class);
        CorrelationContext.run(event.correlationId(), () -> handleInventoryReserved(event));
    }

    @DltHandler
    public void onDeadLetter(String payload) {
        failedKafkaEventService.record(
                topics.inventoryReserved(),
                payload,
                "Payment listener failed after retry policy",
                3
        );
        log.error("Payment event moved to DLT payload={}", payload);
    }

    private void handleInventoryReserved(InventoryReservedEvent event) {
        log.info(
                "Choreography saga payment step started orderNumber={} correlationId={} customer={} amount={}",
                event.orderNumber(),
                event.correlationId(),
                event.customerUsername(),
                event.amount()
        );

        sagaTransactionService.handleInventoryReserved(event);
    }

}
