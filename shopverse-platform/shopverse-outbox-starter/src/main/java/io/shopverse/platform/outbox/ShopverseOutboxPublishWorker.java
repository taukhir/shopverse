package io.shopverse.platform.outbox;

import io.micrometer.core.instrument.MeterRegistry;
import io.shopverse.platform.observability.CorrelationContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;

import java.util.concurrent.TimeUnit;

public class ShopverseOutboxPublishWorker {

    private static final Logger log = LoggerFactory.getLogger(ShopverseOutboxPublishWorker.class);

    private final OutboxEventStore eventStore;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final MeterRegistry meterRegistry;
    private final OutboxPublisherProperties properties;

    public ShopverseOutboxPublishWorker(
            OutboxEventStore eventStore,
            KafkaTemplate<String, String> kafkaTemplate,
            MeterRegistry meterRegistry,
            OutboxPublisherProperties properties
    ) {
        this.eventStore = eventStore;
        this.kafkaTemplate = kafkaTemplate;
        this.meterRegistry = meterRegistry;
        this.properties = properties;
    }

    public void publish(Long eventId) {
        OutboxMessage message = eventStore.claim(eventId);
        if (message == null) {
            return;
        }
        CorrelationContext.run(message.correlationId(), () -> publishRecord(message));
    }

    private void publishRecord(OutboxMessage message) {
        try {
            var result = kafkaTemplate.send(message.topic(), message.messageKey(), message.payload())
                    .get(properties.getSendTimeout().toSeconds(), TimeUnit.SECONDS);
            KafkaPublishMetadata metadata = new KafkaPublishMetadata(
                    result.getRecordMetadata().topic(),
                    result.getRecordMetadata().partition(),
                    result.getRecordMetadata().offset()
            );
            eventStore.markPublished(message.id(), metadata);
            meterRegistry.counter("shopverse.outbox.publish", "outcome", "success").increment();
            log.info(
                    "Outbox event published eventId={} eventType={} aggregateId={} topic={} partition={} offset={}",
                    message.id(),
                    message.eventType(),
                    message.aggregateId(),
                    metadata.topic(),
                    metadata.partition(),
                    metadata.offset()
            );
        } catch (Exception exception) {
            eventStore.markRetryableFailure(message.id(), exception);
            meterRegistry.counter("shopverse.outbox.publish", "outcome", "failed").increment();
            log.error(
                    "Outbox publish failed eventId={} eventType={} aggregateId={} topic={}",
                    message.id(),
                    message.eventType(),
                    message.aggregateId(),
                    message.topic(),
                    exception
            );
        }
    }
}
