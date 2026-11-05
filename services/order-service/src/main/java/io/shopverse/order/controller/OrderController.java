package io.shopverse.order.controller;

import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.shopverse.order.constants.OrderMessages;
import io.shopverse.contracts.order.CatalogItemResponse;
import io.shopverse.contracts.order.CheckoutRequest;
import io.shopverse.contracts.order.OrderDeleteResponse;
import io.shopverse.contracts.order.OrderResponse;
import io.shopverse.contracts.order.OrderTimelineResponse;
import io.shopverse.contracts.order.ServiceHealthResponse;
import io.shopverse.platform.observability.CorrelationConstants;
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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
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
    private final OrderContractMapper mapper;

    // PUBLIC APIs

    @GetMapping("/public/health")
    public ServiceHealthResponse health() {
        healthLog.info("Health check requested for order service");
        return new ServiceHealthResponse(OrderMessages.SERVICE_NAME, OrderMessages.SERVICE_UP);
    }

    @GetMapping("/public/catalog")
    public List<CatalogItemResponse> catalog() {
        log.info("Public product catalog requested through order service");
        return catalogService.getCatalog().stream().map(mapper::toContract).toList();
    }

    // USER APIs

    @GetMapping
    public List<OrderResponse> getOrders(Authentication authentication) {
        log.info("Fetching orders for current user");
        return orderService.getCustomerOrders(authentication.getName()).stream().map(mapper::toContract).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long id, Authentication authentication) {
        log.info("Fetching order by id: {}", id);
        var order = orderService.getOrder(id);
        boolean admin = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
        if (!admin && !order.customerUsername().equals(authentication.getName())) {
            throw new AccessDeniedException("Order does not belong to the current user");
        }
        return ResponseEntity.ok(mapper.toContract(order));
    }

    @GetMapping("/{id}/timeline")
    @Operation(summary = "Get the persisted SAGA timeline for an order")
    @PreAuthorize("hasRole('ADMIN') or @orderAuthorization.isOwner(#id, authentication.name)")
    public List<OrderTimelineResponse> getTimeline(@PathVariable Long id) {
        return orderService.getTimeline(id).stream().map(mapper::toContract).toList();
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
        var order = orderService.checkout(
                mapper.toApplication(request),
                authentication.getName(),
                correlationId,
                idempotencyKey
        );
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(mapper.toContract(order));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel an owned customer order when the lifecycle state allows it")
    public ResponseEntity<OrderResponse> cancelCustomerOrder(
            @PathVariable Long id,
            Authentication authentication
    ) {
        log.warn("Customer cancellation requested for order id={}", id);
        return ResponseEntity.ok(mapper.toContract(orderService.cancelCustomerOrder(id, authentication.getName())));
    }

    @PostMapping("/{id}/return-request")
    @Operation(summary = "Request a return for a delivered owned order")
    public ResponseEntity<OrderResponse> requestReturn(
            @PathVariable Long id,
            Authentication authentication
    ) {
        log.warn("Customer return requested for order id={}", id);
        return ResponseEntity.ok(mapper.toContract(orderService.requestReturn(id, authentication.getName())));
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
        return orderService.getAllOrders().stream().map(mapper::toContract).toList();
    }

    @PostMapping("/admin/{id}/cancel")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Cancel an order from the admin operations workflow")
    public ResponseEntity<OrderResponse> cancelAdminOrder(@PathVariable Long id) {
        log.warn("Admin cancellation requested for order id={}", id);
        return ResponseEntity.ok(mapper.toContract(orderService.cancelAdminOrder(id)));
    }

    @PostMapping("/admin/{id}/pack")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Move a confirmed order to packing")
    public ResponseEntity<OrderResponse> packOrder(@PathVariable Long id) {
        log.info("Admin pack requested for order id={}", id);
        return ResponseEntity.ok(mapper.toContract(orderService.pack(id)));
    }

    @PostMapping("/admin/{id}/ship")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Advance an order through shipping states")
    public ResponseEntity<OrderResponse> shipOrder(@PathVariable Long id) {
        log.info("Admin ship transition requested for order id={}", id);
        return ResponseEntity.ok(mapper.toContract(orderService.ship(id)));
    }

    @PostMapping("/admin/{id}/deliver")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Mark a shipped order delivered")
    public ResponseEntity<OrderResponse> deliverOrder(@PathVariable Long id) {
        log.info("Admin delivery requested for order id={}", id);
        return ResponseEntity.ok(mapper.toContract(orderService.deliver(id)));
    }

    @PostMapping("/admin/catalog-cache/evict")
    @Operation(summary = "Evict cached inventory catalog data")
    public ResponseEntity<Void> evictCatalogCache() {
        log.warn("Admin requested catalog cache eviction");
        catalogService.evictCatalog();
        return ResponseEntity.noContent().build();
    }

}
