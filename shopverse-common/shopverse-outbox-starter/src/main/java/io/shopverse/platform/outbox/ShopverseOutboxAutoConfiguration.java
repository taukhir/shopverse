package io.shopverse.platform.outbox;

import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.kafka.core.KafkaTemplate;

@AutoConfiguration
@ConditionalOnClass(KafkaTemplate.class)
@ConditionalOnBean(OutboxEventStore.class)
@EnableConfigurationProperties(OutboxPublisherProperties.class)
public class ShopverseOutboxAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    ShopverseOutboxPublishWorker shopverseOutboxPublishWorker(
            OutboxEventStore eventStore,
            KafkaTemplate<String, String> kafkaTemplate,
            MeterRegistry meterRegistry,
            OutboxPublisherProperties properties
    ) {
        return new ShopverseOutboxPublishWorker(eventStore, kafkaTemplate, meterRegistry, properties);
    }

    @Bean
    @ConditionalOnMissingBean(name = "outboxPublisher")
    ShopverseOutboxPublisher shopverseOutboxPublisher(
            OutboxEventStore eventStore,
            ShopverseOutboxPublishWorker worker,
            OutboxPublisherProperties properties
    ) {
        return new ShopverseOutboxPublisher(eventStore, worker, properties);
    }
}
