package io.shopverse.platform.kafka.recovery;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Transactional(readOnly = true)
public class KafkaRecoveryService {

    private final FailedKafkaEventStore eventStore;
    private final KafkaReplayOutbox replayOutbox;
    private final ObjectMapper objectMapper;
    private final MeterRegistry meterRegistry;
    private final KafkaRecoveryProperties properties;

    public KafkaRecoveryService(
            FailedKafkaEventStore eventStore,
            KafkaReplayOutbox replayOutbox,
            ObjectMapper objectMapper,
            MeterRegistry meterRegistry,
            KafkaRecoveryProperties properties
    ) {
        this.eventStore = eventStore;
        this.replayOutbox = replayOutbox;
        this.objectMapper = objectMapper;
        this.meterRegistry = meterRegistry;
        this.properties = properties;
    }

    @Transactional
    public void record(String topic, String payload, String reason, int retries) {
        if (eventStore.existsUnreplayed(topic, payload)) {
            return;
        }
        eventStore.saveFailed(topic, payload, reason, retries);
        meterRegistry.counter(properties.getFailedMetricName(), "service", properties.getServiceName()).increment();
    }

    public List<FailedKafkaEventRecord> findAll() {
        return eventStore.findAll();
    }

    @Transactional
    public FailedKafkaEventRecord replay(Long id, String replayedBy) {
        FailedKafkaEventRecord failedEvent = eventStore.findById(id)
                .orElseThrow(() -> new FailedKafkaEventNotFoundException(id));
        JsonNode payload = readPayload(failedEvent.payload());
        replayOutbox.enqueueReplay(
                failedEvent,
                payload,
                payload.path("orderNumber").asText(id.toString()),
                payload.path("correlationId").asText("replay-" + id)
        );
        FailedKafkaEventRecord replayed = eventStore.markReplayed(id, replayedBy);
        meterRegistry.counter(properties.getReplayMetricName(), "service", properties.getServiceName()).increment();
        return replayed;
    }

    private JsonNode readPayload(String payload) {
        try {
            return objectMapper.readTree(payload);
        } catch (Exception exception) {
            throw new KafkaRecoveryException("Stored Kafka payload is not valid JSON", exception);
        }
    }
}
