package io.shopverse.inventory_service.controller;

import io.shopverse.inventory_service.constants.InventoryConstants;
import io.shopverse.inventory_service.dto.ServiceHealthResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping(InventoryConstants.API_ROOT)
public class InventoryController {

    @Value("${shopverse.inventory-service.health-checkup.message:Inventory service is running}")
    private String healthMessage;

    @GetMapping("/public/health")
    public ServiceHealthResponse health() {
        log.info("Health check requested for inventory service");
        return new ServiceHealthResponse(InventoryConstants.SERVICE_NAME, InventoryConstants.SERVICE_UP, healthMessage);
    }
}
