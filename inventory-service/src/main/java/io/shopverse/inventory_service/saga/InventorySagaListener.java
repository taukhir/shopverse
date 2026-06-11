package io.shopverse.inventory_service.saga;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.shopverse.inventory_service.observability.CorrelationContext;
import io.shopverse.inventory_service.service.InventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.annotation.RetryableTopic;
import org.springframework.kafka.annotation.DltHandler;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import io.shopverse.inventory_service.recovery.FailedKafkaEventService;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class InventorySagaListener {

    private final ObjectMapper objectMapper;
    private final InventorySagaTransactionService sagaTransactionService;
    private final InventoryService inventoryService;
    private final FailedKafkaEventService failedKafkaEventService;

    /*
     * This listener consumes OrderCreatedEvent from Kafka.
     *
     * When Order Service creates an order, it publishes an event.
     * Inventory Service listens to that event and starts the inventory step
     * of the Saga.
     *
     * @RetryableTopic(attempts = "3")
     * means Spring Kafka will retry processing this message 3 times
     * if any exception occurs.
     */
    @RetryableTopic(attempts = "3")
    @KafkaListener(
            topics = "${shopverse.kafka.topics.order-created}",
            groupId = "${spring.application.name}"
    )
    public void onOrderCreated(String payload) {

        /*
         * Convert Kafka JSON payload into OrderCreatedEvent object.
         */
        OrderCreatedEvent event = readEvent(payload, OrderCreatedEvent.class);

        /*
         * Run the logic inside CorrelationContext.
         *
         * correlationId is used for distributed tracing/logging.
         * It helps us track one business transaction across multiple services.
         */
        CorrelationContext.run(
                event.correlationId(),
                () -> handleOrderCreated(event)
        );
    }

    /*
     * Handles the actual inventory logic after receiving OrderCreatedEvent.
     */
    private void handleOrderCreated(OrderCreatedEvent event) {

        /*
         * Log useful information for debugging and tracing.
         */
        log.info(
                "Choreography saga inventory step started orderNumber={} correlationId={} productId={} quantity={}",
                event.orderNumber(),
                event.correlationId(),
                event.productId(),
                event.quantity()
        );

        /*
         * Delegate actual Saga transaction logic to service layer.
         *
         * This method may:
         * - check inventory availability
         * - reserve stock
         * - publish InventoryReservedEvent
         * - publish InventoryFailedEvent
         */
        sagaTransactionService.handleOrderCreated(event);
    }

    /*
     * This listener consumes PaymentFailedEvent from Kafka.
     *
     * If payment fails, inventory reservation must be rolled back.
     * This is called compensation in Saga pattern.
     */
    @RetryableTopic(attempts = "3")
    @KafkaListener(
            topics = "${shopverse.kafka.topics.payment-failed}",
            groupId = "${spring.application.name}"
    )
    public void onPaymentFailed(String payload) {

        /*
         * Convert Kafka JSON payload into PaymentFailedEvent object.
         */
        PaymentFailedEvent event = readEvent(payload, PaymentFailedEvent.class);

        /*
         * Execute the compensation logic with correlationId context.
         */
        CorrelationContext.run(
                event.correlationId(),
                () -> handlePaymentFailed(event)
        );
    }

    /*
     * Handles compensation when payment fails.
     */
    private void handlePaymentFailed(PaymentFailedEvent event) {

        /*
         * Release inventory that was previously reserved for this order.
         */
        inventoryService.release(event.orderNumber());

        /*
         * Log compensation action.
         */
        log.warn(
                "Choreography saga compensation released inventory orderNumber={} correlationId={} reason={}",
                event.orderNumber(),
                event.correlationId(),
                event.reason()
        );
    }

    /*
     * Generic method to convert Kafka JSON payload into Java object.
     *
     * Example:
     * readEvent(payload, OrderCreatedEvent.class)
     * readEvent(payload, PaymentFailedEvent.class)
     */
    private <T> T readEvent(String payload, Class<T> eventType) {
        try {
            return objectMapper.readValue(payload, eventType);
        } catch (JsonProcessingException exception) {

            /*
             * Throw runtime exception so Kafka retry mechanism can retry.
             *
             * If this exception keeps happening after all retries,
             * message will move to DLT.
             */
            throw new IllegalArgumentException(
                    "Invalid Kafka event payload for " + eventType.getSimpleName(),
                    exception
            );
        }
    }

    /*
     * This method is called when Kafka message fails even after retries.
     *
     * DLT = Dead Letter Topic.
     *
     * Instead of losing the event, we store it in database using
     * failedKafkaEventService.
     */
    @DltHandler
    public void onDeadLetter(ConsumerRecord<String, String> record) {

        /*
         * Original topic is usually derived by removing "-dlt" suffix.
         *
         * Example:
         * order-created-dlt -> order-created
         */
        String sourceTopic = record.topic().replaceFirst("-dlt$", "");

        /*
         * Store failed event details for manual debugging/reprocessing.
         */
        failedKafkaEventService.record(
                sourceTopic,
                record.value(),
                "Inventory listener failed after retry policy",
                3
        );

        /*
         * Log the failed event.
         */
        log.error(
                "Inventory event moved to DLT sourceTopic={} payload={}",
                sourceTopic,
                record.value()
        );
    }
}