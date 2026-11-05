package io.shopverse.order.controller;

import io.shopverse.contracts.order.*;

/** Maps service-owned application data to the generated HTTP contract. */
final class OrderContractMapper {
    private OrderContractMapper() {
    }

    static io.shopverse.order.dto.CheckoutRequest toApplication(CheckoutRequest request) {
        var address = request.getShippingAddress();
        return new io.shopverse.order.dto.CheckoutRequest(
                request.getItems().stream().map(item -> new io.shopverse.order.dto.CheckoutItemRequest(
                        item.getProductId(), item.getQuantity())).toList(),
                new io.shopverse.order.dto.ShippingAddressRequest(
                        address.getRecipientName(), address.getPhoneNumber(), address.getLine1(), address.getLine2(),
                        address.getCity(), address.getState(), address.getPostalCode(), address.getCountry()));
    }

    static ShippingAddressResponse toContract(io.shopverse.order.dto.ShippingAddressResponse value) {
        if (value == null) {
            return null;
        }
        return new ShippingAddressResponse(
                value.recipientName(),
                value.phoneNumber(),
                value.line1(),
                value.line2(),
                value.city(),
                value.state(),
                value.postalCode(),
                value.country());
    }

    static OrderItemResponse toContract(io.shopverse.order.dto.OrderItemResponse value) {
        if (value == null) {
            return null;
        }
        return new OrderItemResponse(
                value.productId(),
                value.productName(),
                value.quantity(),
                value.unitPrice());
    }

    static OrderResponse toContract(io.shopverse.order.dto.OrderResponse value) {
        if (value == null) {
            return null;
        }
        return new OrderResponse(
                value.id(),
                value.orderNumber(),
                value.correlationId(),
                value.idempotencyKey(),
                value.customerUsername(),
                value.status(),
                value.totalAmount(),
                toContract(value.shippingAddress()),
                value.items().stream().map(OrderContractMapper::toContract).toList(),
                value.createdAt());
    }

    static OrderTimelineResponse toContract(io.shopverse.order.dto.OrderTimelineResponse value) {
        if (value == null) {
            return null;
        }
        return new OrderTimelineResponse(
                value.orderNumber(),
                value.correlationId(),
                value.stage(),
                value.detail(),
                value.occurredAt());
    }

    static CatalogItemResponse toContract(io.shopverse.order.dto.CatalogItemResponse value) {
        if (value == null) {
            return null;
        }
        return new CatalogItemResponse(
                value.productId(),
                value.productName(),
                value.price(),
                value.available(),
                value.imageUrl(),
                value.imageKey());
    }

}
