package io.shopverse.user_service.controller;

import io.shopverse.user_service.constants.ApiConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RefreshScope
@RestController
@RequiredArgsConstructor
@RequestMapping(ApiConstants.PUBLIC_API)
public class HealthController {

    @Value("${shopverse.user-service.health-checkup.message}")
    private String healthCheckMsg;

    @GetMapping("/health")
    public String health() {
        log.info("Health check requested for user service");
        return healthCheckMsg;
    }
}
