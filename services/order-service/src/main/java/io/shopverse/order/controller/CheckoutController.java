package io.shopverse.order.controller;

import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.shopverse.contracts.order.CheckoutRequest;
import io.shopverse.contracts.order.CheckoutResponse;
import io.shopverse.contracts.order.OrderResponse;
import io.shopverse.contracts.order.PlaceOrderRequest;
import io.shopverse.contracts.order.UpdateCheckoutRequest;
import io.shopverse.order.service.CheckoutService;
import io.shopverse.platform.observability.CorrelationConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/checkouts")
@Tag(name = "Checkouts", description = "Persisted, priced checkout quotes and order placement")
@RateLimiter(name = "order-api")
@Bulkhead(name = "order-api", type = Bulkhead.Type.SEMAPHORE)
@Validated
public class CheckoutController {

    private final CheckoutService checkoutService;
    private final OrderContractMapper mapper;

    @PostMapping
    @Operation(summary = "Create a priced, versioned, expiring checkout for review")
    public ResponseEntity<CheckoutResponse> createCheckout(
            @Valid @RequestBody CheckoutRequest request,
            Authentication authentication
    ) {
        log.info("Checkout creation requested");
        var checkout = checkoutService.createCheckout(mapper.toApplication(request), authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toContract(checkout));
    }

    @GetMapping("/{checkoutId}")
    @Operation(summary = "Get the current checkout for the authenticated customer")
    public ResponseEntity<CheckoutResponse> getCheckout(
            @PathVariable String checkoutId,
            Authentication authentication
    ) {
        log.info("Checkout lookup requested");
        var checkout = checkoutService.getCheckout(checkoutId, authentication.getName());
        return ResponseEntity.ok(mapper.toContract(checkout));
    }

    @PutMapping("/{checkoutId}")
    @Operation(summary = "Replace checkout selections and recalculate the quote")
    public ResponseEntity<CheckoutResponse> updateCheckout(
            @PathVariable String checkoutId,
            @Valid @RequestBody UpdateCheckoutRequest request,
            Authentication authentication
    ) {
        log.info("Checkout update requested");
        var checkout = checkoutService.updateCheckout(
                checkoutId, mapper.toApplication(request), authentication.getName());
        return ResponseEntity.ok(mapper.toContract(checkout));
    }

    @PostMapping("/{checkoutId}/place-order")
    @Operation(summary = "Place an order from the checkout version the customer reviewed; starts the Kafka SAGA")
    public ResponseEntity<OrderResponse> placeOrder(
            @PathVariable String checkoutId,
            @Valid @RequestBody PlaceOrderRequest request,
            @Parameter(
                    description = "Stable key reused by retries of the same placement",
                    required = true,
                    example = "checkout-user-42-cart-9001"
            )
            @RequestHeader("Idempotency-Key")
            @NotBlank
            @Size(max = 100)
            String idempotencyKey,
            Authentication authentication
    ) {
        log.info("Place-order requested for current user; starting choreography saga");
        String correlationId = org.slf4j.MDC.get(CorrelationConstants.MDC_KEY);
        var order = checkoutService.placeOrder(
                checkoutId,
                mapper.toApplication(request),
                authentication.getName(),
                correlationId,
                idempotencyKey
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toContract(order));
    }
}
