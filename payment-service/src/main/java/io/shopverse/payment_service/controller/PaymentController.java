package io.shopverse.payment_service.controller;

import io.shopverse.payment_service.constants.PaymentConstants;
import io.shopverse.payment_service.dto.ServiceHealthResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping(PaymentConstants.API_ROOT)
public class PaymentController {

    @Value("${shopverse.payment-service.health-checkup.message:Payment service is running}")
    private String healthMessage;

    @GetMapping("/public/health")
    public ServiceHealthResponse health() {
        log.info("Health check requested for payment service");
        return new ServiceHealthResponse(PaymentConstants.SERVICE_NAME, PaymentConstants.SERVICE_UP, healthMessage);
    }
}
