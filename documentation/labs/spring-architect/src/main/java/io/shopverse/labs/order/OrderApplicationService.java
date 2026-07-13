package io.shopverse.labs.order;

import java.math.BigDecimal;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderApplicationService {
    private final OrderRepository orders;

    public OrderApplicationService(OrderRepository orders) {
        this.orders = orders;
    }

    @Transactional
    public UUID placeOrder(String customerId, String sku, int quantity) {
        var order = new OrderEntity(UUID.randomUUID(), customerId);
        order.addLine(sku, quantity, new BigDecimal("19.99"));
        return orders.save(order).getId();
    }

    @Transactional
    public void placeOrderThenFail(String customerId) {
        placeOrder(customerId, "SKU-ROLLBACK", 1);
        throw new IllegalStateException("Payment authorization failed");
    }
}
