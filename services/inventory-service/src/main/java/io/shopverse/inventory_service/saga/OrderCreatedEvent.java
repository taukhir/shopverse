package io.shopverse.inventory_service.saga;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public record OrderCreatedEvent(
        Long orderId,
        String orderNumber,
        String correlationId,
        String customerUsername,
        Long productId,
        Integer quantity,
        BigDecimal amount,
        List<LineItem> items
) {

    public OrderCreatedEvent {
        items = items == null ? null : Collections.unmodifiableList(new ArrayList<>(items));
    }

    public List<LineItem> items() {
        return items == null || items.isEmpty()
                ? List.of(new LineItem(productId, quantity))
                : items;
    }
}
