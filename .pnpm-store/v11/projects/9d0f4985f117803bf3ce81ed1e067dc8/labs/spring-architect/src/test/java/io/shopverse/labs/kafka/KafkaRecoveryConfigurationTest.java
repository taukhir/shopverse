package io.shopverse.labs.kafka;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import org.junit.jupiter.api.Test;
import org.springframework.kafka.core.KafkaOperations;

class KafkaRecoveryConfigurationTest {
    @Test
    void retryAndDltPolicyCanBeConstructedAgainstTheCurrentSpringKafkaApi() {
        @SuppressWarnings("unchecked")
        KafkaOperations<Object, Object> operations = mock(KafkaOperations.class);

        var errorHandler = new KafkaRecoveryConfiguration().orderErrorHandler(operations);

        assertThat(errorHandler).isNotNull();
    }
}
