package io.shopverse.order.service;

import io.shopverse.order.dto.CheckoutRequest;
import io.shopverse.order.dto.CheckoutResponse;
import io.shopverse.order.dto.OrderResponse;
import io.shopverse.order.dto.PlaceOrderRequest;

public interface CheckoutService {

    CheckoutResponse createCheckout(CheckoutRequest request, String username);

    OrderResponse placeOrder(
            String checkoutNumber,
            PlaceOrderRequest request,
            String username,
            String correlationId,
            String idempotencyKey
    );
}
