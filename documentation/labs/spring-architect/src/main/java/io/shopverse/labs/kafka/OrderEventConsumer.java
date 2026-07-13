package io.shopverse.labs.kafka;

import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "labs.kafka.enabled", havingValue = "true")
public class OrderEventConsumer {
    private final Set<UUID> processedEventIds = ConcurrentHashMap.newKeySet();
    private final AtomicInteger sideEffects = new AtomicInteger();

    @KafkaListener(topics = "orders.created", groupId = "shopverse-order-projection")
    public void consume(OrderCreatedEvent event) {
        if (!processedEventIds.add(event.eventId())) {
            return;
        }
        sideEffects.incrementAndGet();
    }

    public int sideEffects() {
        return sideEffects.get();
    }
}
