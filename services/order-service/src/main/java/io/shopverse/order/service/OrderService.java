package io.shopverse.order.service;

import io.shopverse.order.dto.CheckoutRequest;
import io.shopverse.order.dto.OrderResponse;
import io.shopverse.order.dto.OrderTimelineResponse;
import io.shopverse.order.dto.AdminOrderSummaryResponse;
import io.shopverse.platform.web.pagination.PageResponse;

import java.util.List;

public interface OrderService {

    OrderResponse checkout(CheckoutRequest request, String username, String correlationId, String idempotencyKey);

    OrderResponse getOrder(Long id);

    List<OrderResponse> getCustomerOrders(String username);

    List<OrderResponse> getAllOrders();

    PageResponse<AdminOrderSummaryResponse> getAdminOrders(
            int page,
            int size,
            String search,
            String status,
            String sortBy,
            String direction
    );

    List<OrderTimelineResponse> getTimeline(Long orderId);

    void cancel(Long id);

    OrderResponse cancelCustomerOrder(Long id, String username);

    OrderResponse cancelAdminOrder(Long id);

    OrderResponse pack(Long id);

    OrderResponse ship(Long id);

    OrderResponse deliver(Long id);

    OrderResponse requestReturn(Long id, String username);

    void markInventoryRejected(String orderNumber, String reason);

    void markInventoryReservedAndPaymentProcessing(String orderNumber);

    void markPaymentFailed(String orderNumber, String reason);

    void confirm(String orderNumber, String paymentReference);
}
