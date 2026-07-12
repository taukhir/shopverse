package io.shopverse.payment_service.controller;

import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.shopverse.payment_service.constants.PaymentConstants;
import io.shopverse.payment_service.dto.PaymentIntentRequest;
import io.shopverse.payment_service.dto.PaymentResponse;
import io.shopverse.payment_service.dto.PaymentWebhookRequest;
import io.shopverse.payment_service.dto.FailedKafkaEventResponse;
import io.shopverse.payment_service.dto.ServiceHealthResponse;
import io.shopverse.payment_service.service.PaymentService;
import io.shopverse.payment_service.service.FailedKafkaEventService;
import io.shopverse.payment_service.provider.PaymentSimulationMode;
import io.shopverse.payment_service.provider.StubPaymentProvider;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping(PaymentConstants.API_ROOT)
@Tag(name = "Payments", description = "Payment status and administration APIs")
@RateLimiter(name = "payment-api")
@Bulkhead(name = "payment-api", type = Bulkhead.Type.SEMAPHORE)
public class PaymentController {

    private static final Logger healthLog = LoggerFactory.getLogger("io.shopverse.health");

    @Value("${shopverse.payment-service.health-checkup.message:Payment service is running}")
    private String healthMessage;

    private final PaymentService paymentService;
    private final StubPaymentProvider stubPaymentProvider;
    private final FailedKafkaEventService failedKafkaEventService;

    @GetMapping("/public/health")
    public ServiceHealthResponse health() {
        healthLog.info("Health check requested for payment service");
        return new ServiceHealthResponse(PaymentConstants.SERVICE_NAME, PaymentConstants.SERVICE_UP, healthMessage);
    }

    @GetMapping("/orders/{orderNumber}")
    @PreAuthorize("hasRole('ADMIN') or @paymentAuthorization.isOwner(#orderNumber, authentication.name)")
    public PaymentResponse getByOrderNumber(@PathVariable String orderNumber) {
        return paymentService.getByOrderNumber(orderNumber);
    }

    @PostMapping("/intent")
    @Operation(summary = "Create or return an idempotent payment intent for an order")
    public PaymentResponse createIntent(
            @Valid @org.springframework.web.bind.annotation.RequestBody PaymentIntentRequest request,
            Authentication authentication
    ) {
        return paymentService.createIntent(
                request.orderNumber(),
                request.correlationId(),
                authentication.getName(),
                request.amount()
        );
    }

    @PostMapping("/orders/{orderNumber}/retry")
    @PreAuthorize("hasRole('ADMIN') or @paymentAuthorization.isOwner(#orderNumber, authentication.name)")
    @Operation(summary = "Retry a declined or timed-out payment")
    public PaymentResponse retry(@PathVariable String orderNumber) {
        return paymentService.retry(orderNumber);
    }

    @PostMapping("/orders/{orderNumber}/refund")
    @PreAuthorize("hasRole('ADMIN') or @paymentAuthorization.isOwner(#orderNumber, authentication.name)")
    @Operation(summary = "Request a refund for a captured payment")
    public PaymentResponse refundRequest(@PathVariable String orderNumber) {
        return paymentService.refund(orderNumber);
    }

    @PostMapping("/webhooks/provider")
    @Operation(summary = "Receive a provider payment status callback")
    public PaymentResponse providerWebhook(@Valid @org.springframework.web.bind.annotation.RequestBody PaymentWebhookRequest request) {
        return paymentService.applyWebhook(request);
    }

    @GetMapping("/admin")
    public List<PaymentResponse> getAll() {
        return paymentService.getAll();
    }

    @PostMapping("/admin/simulation")
    @Operation(summary = "Select the third-party payment stub outcome")
    public PaymentSimulationMode setSimulation(@RequestParam PaymentSimulationMode mode) {
        stubPaymentProvider.setMode(mode);
        return stubPaymentProvider.mode();
    }

    @PostMapping("/admin/orders/{orderNumber}/reconcile")
    @Operation(summary = "Reconcile a timed-out payment and publish completion")
    public PaymentResponse reconcile(@PathVariable String orderNumber) {
        PaymentResponse payment = paymentService.reconcile(orderNumber);
        return payment;
    }

    @PostMapping("/admin/orders/{orderNumber}/refund")
    public PaymentResponse refund(@PathVariable String orderNumber) {
        return paymentService.refund(orderNumber);
    }

    @GetMapping("/admin/dead-letters")
    @Operation(summary = "Inspect persisted payment DLT records")
    public List<FailedKafkaEventResponse> deadLetters() {
        return failedKafkaEventService.getAll();
    }

    @PostMapping("/admin/dead-letters/{id}/replay")
    @Operation(summary = "Replay a persisted failed Kafka event")
    public FailedKafkaEventResponse replay(@PathVariable Long id, Authentication authentication) {
        return failedKafkaEventService.replay(id, authentication.getName());
    }
}
