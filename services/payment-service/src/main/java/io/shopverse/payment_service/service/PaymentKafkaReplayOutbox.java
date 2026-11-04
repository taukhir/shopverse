package io.shopverse.payment_service.service;

import io.shopverse.payment_service.outbox.OutboxService;
import io.shopverse.platform.kafka.recovery.FailedKafkaEventRecord;
import io.shopverse.platform.kafka.recovery.KafkaReplayOutbox;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PaymentKafkaReplayOutbox implements KafkaReplayOutbox {

    private final OutboxService outboxService;

    @Override
    public void enqueueReplay(
            FailedKafkaEventRecord failedEvent,
            Object payload,
            String messageKey,
            String correlationId
    ) {
        outboxService.enqueue(
                "FAILED_KAFKA_EVENT",
                failedEvent.id().toString(),
                "KafkaEventReplay",
                failedEvent.sourceTopic(),
                messageKey,
                payload,
                correlationId
        );
    }
}
