package io.shopverse.order.service;

import io.shopverse.order.dto.CheckoutRequest;
import io.shopverse.order.dto.OrderResponse;
import io.shopverse.order.dto.OrderTimelineResponse;

import java.util.List;

public interface OrderService {

    OrderResponse checkout(CheckoutRequest request, String username, String correlationId, String idempotencyKey);

    OrderResponse getOrder(Long id);

    List<OrderResponse> getCustomerOrders(String username);

    List<OrderResponse> getAllOrders();

    List<OrderTimelineResponse> getTimeline(Long orderId);

    void cancel(Long id);

    void markInventoryRejected(String orderNumber, String reason);

    void markInventoryReserved(String orderNumber);

    void markPaymentProcessing(String orderNumber);

    void markPaymentFailed(String orderNumber, String reason);

    void confirm(String orderNumber, String paymentReference);
}
