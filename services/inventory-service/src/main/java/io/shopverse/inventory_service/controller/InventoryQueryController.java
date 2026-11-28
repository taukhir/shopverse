package io.shopverse.inventory_service.controller;

import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.shopverse.inventory_service.constants.InventoryConstants;
import io.shopverse.inventory_service.dto.InventoryResponse;
import io.shopverse.inventory_service.service.catalog.InventoryCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping(InventoryConstants.API_ROOT)
@RateLimiter(name = "inventory-api")
@Bulkhead(name = "inventory-api", type = Bulkhead.Type.SEMAPHORE)
public class InventoryQueryController {

    private final InventoryCatalogService inventoryCatalogService;

    @GetMapping("/{productId}")
    public InventoryResponse getInventory(@PathVariable Long productId) {
        return inventoryCatalogService.getByProductId(productId);
    }
}
