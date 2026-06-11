package io.shopverse.discovery.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RefreshScope
@RestController
@RequestMapping("/api")
public class HealthController {

    Logger logger = LoggerFactory.getLogger(HealthController.class);

    @GetMapping("/health")
    public String health() {
        logger.info("Health check requested for user service");
        return "discovery service is up";
    }
}
