package io.shopverse.platform.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class KafkaEventParserTest {

    private final KafkaEventParser parser = new KafkaEventParser(new ObjectMapper());

    @Test
    void parsesPayloadIntoEventType() {
        TestEvent event = parser.parse("{\"id\":\"evt-1\"}", TestEvent.class);

        assertThat(event.id()).isEqualTo("evt-1");
    }

    @Test
    void wrapsInvalidPayloadWithEventTypeAndPayload() {
        assertThatThrownBy(() -> parser.parse("{", TestEvent.class))
                .isInstanceOfSatisfying(KafkaEventParseException.class, exception -> {
                    assertThat(exception.getPayload()).isEqualTo("{");
                    assertThat(exception.getEventType()).isEqualTo(TestEvent.class);
                    assertThat(exception).hasMessage("Invalid Kafka event payload for TestEvent");
                });
    }

    record TestEvent(String id) {
    }
}
