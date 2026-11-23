package io.shopverse.user_service.controller.publicapi;

import io.shopverse.user_service.constants.ApiConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import io.swagger.v3.oas.annotations.Operation;

@Slf4j
@RefreshScope
@RestController
@RequiredArgsConstructor
@RequestMapping(ApiConstants.PUBLIC_API)
public class HealthController {

    private static final Logger healthLog = LoggerFactory.getLogger("io.shopverse.health");

    @Value("${shopverse.user-service.health-checkup.message}")
    private String healthCheckMsg;

    @GetMapping("/health")
    @Operation(summary = "Get User Service health", security = {})
    public String health() {
        healthLog.info("Health check requested for user service");
        return healthCheckMsg;
    }
}
