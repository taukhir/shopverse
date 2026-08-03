package io.shopverse.labs.kafka;

import org.apache.kafka.common.TopicPartition;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.KafkaOperations;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.ExponentialBackOff;

@Configuration
@ConditionalOnProperty(name = "labs.kafka.enabled", havingValue = "true")
public class KafkaRecoveryConfiguration {
    @Bean
    DefaultErrorHandler orderErrorHandler(KafkaOperations<Object, Object> operations) {
        var recoverer = new DeadLetterPublishingRecoverer(
                operations,
                (record, failure) -> new TopicPartition(record.topic() + ".DLT", record.partition()));

        var backOff = new ExponentialBackOff(250L, 2.0);
        backOff.setMaxInterval(2_000L);
        backOff.setMaxElapsedTime(5_000L);

        var handler = new DefaultErrorHandler(recoverer, backOff);
        handler.addNotRetryableExceptions(IllegalArgumentException.class);
        handler.setCommitRecovered(true);
        return handler;
    }
}
