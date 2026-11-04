package io.shopverse.order.service;

import io.shopverse.order.dto.OrderItemResponse;
import io.shopverse.order.dto.OrderResponse;
import io.shopverse.order.dto.ShippingAddressResponse;
import io.shopverse.order.entity.OrderEntity;

import java.util.List;

final class OrderMapper {

    private OrderMapper() {
    }

    static OrderResponse toResponse(OrderEntity order) {
        List<OrderItemResponse> items = order.getItems().stream()
                .map(item -> new OrderItemResponse(
                        item.getProductId(),
                        item.getProductName(),
                        item.getQuantity(),
                        item.getUnitPrice()
                ))
                .toList();

        return new OrderResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getCorrelationId(),
                order.getIdempotencyKey(),
                order.getCustomerUsername(),
                order.getStatus().name(),
                order.getTotalAmount(),
                shippingAddress(order),
                items,
                order.getCreatedAt()
        );
    }

    private static ShippingAddressResponse shippingAddress(OrderEntity order) {
        if (order.getShippingLine1() == null) {
            return null;
        }
        return new ShippingAddressResponse(
                order.getShippingRecipientName(),
                order.getShippingPhoneNumber(),
                order.getShippingLine1(),
                order.getShippingLine2(),
                order.getShippingCity(),
                order.getShippingState(),
                order.getShippingPostalCode(),
                order.getShippingCountry()
        );
    }
}
