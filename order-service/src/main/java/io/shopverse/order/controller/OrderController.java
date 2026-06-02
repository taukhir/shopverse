package io.shopverse.order.controller;

import io.shopverse.order.constants.OrderMessages;
import io.shopverse.order.data.SampleOrderData;
import io.shopverse.order.dto.CatalogItemResponse;
import io.shopverse.order.dto.OrderDeleteResponse;
import io.shopverse.order.dto.OrderResponse;
import io.shopverse.order.dto.ServiceHealthResponse;
import io.shopverse.order.saga.OrderSagaPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final SampleOrderData sampleOrderData;
    private final OrderSagaPublisher orderSagaPublisher;

    // PUBLIC APIs

    @GetMapping("/public/health")
    public ServiceHealthResponse health() {
        log.info("Health check requested for order service");
        return new ServiceHealthResponse(OrderMessages.SERVICE_NAME, OrderMessages.SERVICE_UP);
    }

    @GetMapping("/public/catalog")
    public List<CatalogItemResponse> catalog() {
        log.info("Public product catalog requested through order service");
        return sampleOrderData.catalog();
    }

    // USER APIs

    @GetMapping
    public List<OrderResponse> getOrders() {
        log.info("Fetching orders for current user");
        return sampleOrderData.orders();
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long id) {
        log.info("Fetching order by id: {}", id);
        return sampleOrderData.orderById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder() {
        log.info("Creating order for current user");
        OrderResponse order = sampleOrderData.newSampleOrder();
        orderSagaPublisher.publishOrderCreated(order);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(order);
    }

    @PostMapping("/checkout")
    public ResponseEntity<OrderResponse> checkout() {
        log.info("Checkout requested for current user; starting choreography saga");
        OrderResponse order = sampleOrderData.newSampleOrder();
        orderSagaPublisher.publishOrderCreated(order);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(order);
    }

    // ADMIN APIs

    @DeleteMapping("/{id}")
    public OrderDeleteResponse deleteOrder(@PathVariable Long id) {
        log.warn("Deleting order by id: {}", id);
        return sampleOrderData.deleteResponse(id);
    }

    @GetMapping("/admin/all")
    public List<OrderResponse> allOrders() {
        log.info("Admin requested all orders");
        return sampleOrderData.orders();
    }

}
