package io.shopverse.platform.kafka.recovery;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;

@AutoConfiguration
@ConditionalOnBean({FailedKafkaEventStore.class, KafkaReplayOutbox.class})
@EnableConfigurationProperties(KafkaRecoveryProperties.class)
public class KafkaRecoveryAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    KafkaRecoveryService kafkaRecoveryService(
            FailedKafkaEventStore eventStore,
            KafkaReplayOutbox replayOutbox,
            ObjectMapper objectMapper,
            MeterRegistry meterRegistry,
            KafkaRecoveryProperties properties
    ) {
        return new KafkaRecoveryService(eventStore, replayOutbox, objectMapper, meterRegistry, properties);
    }
}
