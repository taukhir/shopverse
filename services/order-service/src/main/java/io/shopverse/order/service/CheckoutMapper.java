package io.shopverse.order.service;

import io.shopverse.order.dto.CheckoutResponse;
import io.shopverse.order.dto.OrderItemResponse;
import io.shopverse.order.dto.ShippingAddressResponse;
import io.shopverse.order.entity.CheckoutEntity;

import java.time.Instant;
import java.util.List;

final class CheckoutMapper {

    private CheckoutMapper() {
    }

    static CheckoutResponse toResponse(CheckoutEntity checkout, Instant now) {
        List<OrderItemResponse> items = checkout.getItems().stream()
                .map(item -> new OrderItemResponse(
                        item.getProductId(),
                        item.getProductName(),
                        item.getQuantity(),
                        item.getUnitPrice()
                ))
                .toList();

        return new CheckoutResponse(
                checkout.getCheckoutNumber(),
                checkout.getVersion(),
                status(checkout, now),
                items,
                shippingAddress(checkout),
                checkout.getCurrency(),
                checkout.getTotalAmount(),
                checkout.getExpiresAt(),
                checkout.getOrderId()
        );
    }

    private static String status(CheckoutEntity checkout, Instant now) {
        if (checkout.isPlaced()) {
            return "PLACED";
        }
        return checkout.isExpired(now) ? "EXPIRED" : "READY_TO_PLACE";
    }

    private static ShippingAddressResponse shippingAddress(CheckoutEntity checkout) {
        if (checkout.getShippingLine1() == null) {
            return null;
        }
        return new ShippingAddressResponse(
                checkout.getShippingRecipientName(),
                checkout.getShippingPhoneNumber(),
                checkout.getShippingLine1(),
                checkout.getShippingLine2(),
                checkout.getShippingCity(),
                checkout.getShippingState(),
                checkout.getShippingPostalCode(),
                checkout.getShippingCountry()
        );
    }
}
