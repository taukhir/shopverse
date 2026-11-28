package io.shopverse.inventory_service.controller;

import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.shopverse.inventory_service.constants.InventoryConstants;
import io.shopverse.inventory_service.dto.InventoryResponse;
import io.shopverse.inventory_service.dto.ServiceHealthResponse;
import io.shopverse.inventory_service.service.catalog.InventoryCatalogService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping(InventoryConstants.PUBLIC_API)
@Tag(name = "Inventory Catalog", description = "Public product catalog and browsing APIs")
@RateLimiter(name = "inventory-api")
@Bulkhead(name = "inventory-api", type = Bulkhead.Type.SEMAPHORE)
public class InventoryCatalogController {

    private static final Logger healthLog = LoggerFactory.getLogger("io.shopverse.health");

    @Value("${shopverse.inventory-service.health-checkup.message:Inventory service is running}")
    private String healthMessage;

    private final InventoryCatalogService inventoryCatalogService;

    @GetMapping("/health")
    public ServiceHealthResponse health() {
        healthLog.info("Health check requested for inventory service");
        return new ServiceHealthResponse(
                InventoryConstants.SERVICE_NAME,
                InventoryConstants.SERVICE_UP,
                healthMessage
        );
    }

    @GetMapping("/items")
    public List<InventoryResponse> catalog() {
        return inventoryCatalogService.getAll();
    }

    @GetMapping("/items/{productId}")
    public InventoryResponse getItem(@PathVariable Long productId) {
        return inventoryCatalogService.getByProductId(productId);
    }

    @GetMapping("/categories")
    public List<String> categories() {
        return inventoryCatalogService.getCategories();
    }

    @GetMapping("/items/{productId}/related")
    public List<InventoryResponse> related(@PathVariable Long productId) {
        return inventoryCatalogService.getRelated(productId);
    }
}
