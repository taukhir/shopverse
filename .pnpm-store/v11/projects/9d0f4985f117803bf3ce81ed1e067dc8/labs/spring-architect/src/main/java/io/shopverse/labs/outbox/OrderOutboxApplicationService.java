package io.shopverse.labs.outbox;

import io.shopverse.labs.order.OrderEntity;
import io.shopverse.labs.order.OrderRepository;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderOutboxApplicationService {
    private final OrderRepository orders;
    private final OutboxEventRepository outbox;

    public OrderOutboxApplicationService(
            OrderRepository orders, OutboxEventRepository outbox) {
        this.orders = orders;
        this.outbox = outbox;
    }

    @Transactional
    public UUID createOrder(String customerId) {
        UUID orderId = UUID.randomUUID();
        orders.save(new OrderEntity(orderId, customerId));
        outbox.save(new OutboxEventEntity(
                UUID.randomUUID(), orderId, 1, "OrderCreated",
                "{\"orderId\":\"" + orderId + "\"}", Instant.now()));
        return orderId;
    }

    @Transactional
    public void createOrderThenFail(String customerId) {
        createOrder(customerId);
        throw new IllegalStateException("Failure after both inserts and before commit");
    }
}
