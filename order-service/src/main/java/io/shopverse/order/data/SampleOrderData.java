package io.shopverse.order.data;

import io.shopverse.order.constants.OrderMessages;
import io.shopverse.order.dto.CatalogItemResponse;
import io.shopverse.order.dto.OrderDeleteResponse;
import io.shopverse.order.dto.OrderItemResponse;
import io.shopverse.order.dto.OrderResponse;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Component
public class SampleOrderData {

    private static final List<CatalogItemResponse> CATALOG = List.of(
            new CatalogItemResponse(101L, "Wireless Keyboard", new BigDecimal("2499.00"), true),
            new CatalogItemResponse(102L, "USB-C Dock", new BigDecimal("5299.00"), true),
            new CatalogItemResponse(103L, "Noise Cancelling Headphones", new BigDecimal("8999.00"), false)
    );

    private static final List<OrderResponse> ORDERS = List.of(
            new OrderResponse(
                    1L,
                    "ORD-1001",
                    "ahmed",
                    OrderMessages.ORDER_CREATED_STATUS,
                    new BigDecimal("7798.00"),
                    List.of(
                            new OrderItemResponse(101L, "Wireless Keyboard", 1, new BigDecimal("2499.00")),
                            new OrderItemResponse(102L, "USB-C Dock", 1, new BigDecimal("5299.00"))
                    ),
                    Instant.parse("2026-05-31T09:00:00Z")
            ),
            new OrderResponse(
                    2L,
                    "ORD-1002",
                    "demo-user",
                    "SHIPPED",
                    new BigDecimal("8999.00"),
                    List.of(
                            new OrderItemResponse(103L, "Noise Cancelling Headphones", 1, new BigDecimal("8999.00"))
                    ),
                    Instant.parse("2026-05-31T10:30:00Z")
            )
    );

    public List<CatalogItemResponse> catalog() {
        return CATALOG;
    }

    public List<OrderResponse> orders() {
        return ORDERS;
    }

    public Optional<OrderResponse> orderById(Long id) {
        return ORDERS.stream()
                .filter(order -> order.id().equals(id))
                .findFirst();
    }

    public OrderResponse newSampleOrder() {
        return new OrderResponse(
                3L,
                "ORD-1003",
                "current-user",
                OrderMessages.ORDER_CREATED_STATUS,
                new BigDecimal("2499.00"),
                List.of(new OrderItemResponse(101L, "Wireless Keyboard", 1, new BigDecimal("2499.00"))),
                Instant.now()
        );
    }

    public OrderDeleteResponse deleteResponse(Long id) {
        return new OrderDeleteResponse(
                id,
                OrderMessages.ORDER_DELETED_STATUS,
                OrderMessages.SAMPLE_DELETE_MESSAGE
        );
    }
}
