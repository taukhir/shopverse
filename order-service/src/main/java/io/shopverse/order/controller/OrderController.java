package io.shopverse.order.controller;

import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.shopverse.order.constants.OrderMessages;
import io.shopverse.order.dto.CatalogItemResponse;
import io.shopverse.order.dto.CheckoutRequest;
import io.shopverse.order.dto.OrderDeleteResponse;
import io.shopverse.order.dto.OrderResponse;
import io.shopverse.order.dto.OrderTimelineResponse;
import io.shopverse.order.dto.ServiceHealthResponse;
import io.shopverse.order.observability.CorrelationConstants;
import io.shopverse.order.saga.OrderSagaPublisher;
import io.shopverse.order.service.CatalogService;
import io.shopverse.order.service.OrderService;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/orders")
@Tag(name = "Orders", description = "Persistent order and checkout APIs")
@RateLimiter(name = "order-api")
@Bulkhead(name = "order-api", type = Bulkhead.Type.SEMAPHORE)
@Validated
public class OrderController {

    private static final Logger healthLog = LoggerFactory.getLogger("io.shopverse.health");

    private final OrderService orderService;
    private final CatalogService catalogService;
    private final OrderSagaPublisher orderSagaPublisher;

    // PUBLIC APIs

    @GetMapping("/public/health")
    public ServiceHealthResponse health() {
        healthLog.info("Health check requested for order service");
        return new ServiceHealthResponse(OrderMessages.SERVICE_NAME, OrderMessages.SERVICE_UP);
    }

    @GetMapping("/public/catalog")
    public List<CatalogItemResponse> catalog() {
        log.info("Public product catalog requested through order service");
        return catalogService.getCatalog();
    }

    // USER APIs

    @GetMapping
    public List<OrderResponse> getOrders(Authentication authentication) {
        log.info("Fetching orders for current user");
        return orderService.getCustomerOrders(authentication.getName());
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long id, Authentication authentication) {
        log.info("Fetching order by id: {}", id);
        OrderResponse order = orderService.getOrder(id);
        boolean admin = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
        if (!admin && !order.customerUsername().equals(authentication.getName())) {
            throw new AccessDeniedException("Order does not belong to the current user");
        }
        return ResponseEntity.ok(order);
    }

    @GetMapping("/{id}/timeline")
    @Operation(summary = "Get the persisted SAGA timeline for an order")
    public List<OrderTimelineResponse> getTimeline(@PathVariable Long id) {
        return orderService.getTimeline(id);
    }

    @PostMapping("/checkout")
    @Operation(summary = "Create an idempotent checkout and start the Kafka SAGA")
    public ResponseEntity<OrderResponse> checkout(
            @Valid @RequestBody CheckoutRequest request,
            @Parameter(
                    description = "Stable key reused by retries of the same checkout",
                    required = true,
                    example = "checkout-user-42-cart-9001"
            )
            @RequestHeader("Idempotency-Key")
            @NotBlank
            @Size(max = 100)
            String idempotencyKey,
            Authentication authentication
    ) {
        log.info("Checkout requested for current user; starting choreography saga");
        String correlationId = org.slf4j.MDC.get(CorrelationConstants.MDC_KEY);
        OrderResponse order = orderService.checkout(
                request,
                authentication.getName(),
                correlationId,
                idempotencyKey
        );
        orderSagaPublisher.publishOrderCreated(order, order.correlationId());
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(order);
    }

    // ADMIN APIs

    @DeleteMapping("/{id}")
    public OrderDeleteResponse deleteOrder(@PathVariable Long id) {
        log.warn("Deleting order by id: {}", id);
        orderService.cancel(id);
        return new OrderDeleteResponse(id, "CANCELLED", "Order cancelled");
    }

    @GetMapping("/admin/all")
    public List<OrderResponse> allOrders() {
        log.info("Admin requested all orders");
        return orderService.getAllOrders();
    }

}
