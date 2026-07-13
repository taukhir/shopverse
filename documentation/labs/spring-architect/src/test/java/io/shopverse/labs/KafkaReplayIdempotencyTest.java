package io.shopverse.labs;

import static org.assertj.core.api.Assertions.assertThat;

import io.shopverse.labs.kafka.OrderCreatedEvent;
import io.shopverse.labs.kafka.OrderEventConsumer;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class KafkaReplayIdempotencyTest {
    @Test
    void replayingTheSameEventDoesNotRepeatTheSideEffect() {
        var consumer = new OrderEventConsumer();
        var event = new OrderCreatedEvent(UUID.randomUUID(), UUID.randomUUID(), "customer-4");

        consumer.consume(event);
        consumer.consume(event);

        assertThat(consumer.sideEffects()).isEqualTo(1);
    }
}
