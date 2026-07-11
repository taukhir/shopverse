package io.shopverse.inventory_service.controller;

import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.shopverse.inventory_service.constants.InventoryConstants;
import io.shopverse.inventory_service.dto.InventoryResponse;
import io.shopverse.inventory_service.dto.InventoryReservationResponse;
import io.shopverse.inventory_service.dto.InventoryUpsertRequest;
import io.shopverse.inventory_service.dto.InventoryImageResponse;
import io.shopverse.inventory_service.dto.ServiceHealthResponse;
import io.shopverse.inventory_service.service.InventoryService;
import io.shopverse.inventory_service.service.InventoryImageService;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping(InventoryConstants.API_ROOT)
@Tag(name = "Inventory", description = "Stock availability and administration APIs")
@RateLimiter(name = "inventory-api")
@Bulkhead(name = "inventory-api", type = Bulkhead.Type.SEMAPHORE)
public class InventoryController {

    private static final Logger healthLog = LoggerFactory.getLogger("io.shopverse.health");

    @Value("${shopverse.inventory-service.health-checkup.message:Inventory service is running}")
    private String healthMessage;

    private final InventoryService inventoryService;
    private final InventoryImageService inventoryImageService;

    @GetMapping("/public/health")
    public ServiceHealthResponse health() {
        healthLog.info("Health check requested for inventory service");
        return new ServiceHealthResponse(InventoryConstants.SERVICE_NAME, InventoryConstants.SERVICE_UP, healthMessage);
    }

    @GetMapping("/public/items")
    public List<InventoryResponse> catalog() {
        return inventoryService.getAll();
    }

    @GetMapping("/public/items/{productId}")
    public InventoryResponse publicItem(@PathVariable Long productId) {
        return inventoryService.getByProductId(productId);
    }

    @GetMapping("/{productId}")
    public InventoryResponse getInventory(@PathVariable Long productId) {
        return inventoryService.getByProductId(productId);
    }

    @PutMapping("/admin/items")
    @Operation(summary = "Create or replace product stock")
    public InventoryResponse upsert(@Valid @RequestBody InventoryUpsertRequest request) {
        return inventoryService.upsert(request);
    }

    @PostMapping("/admin/items/{productId}/image")
    @Operation(summary = "Upload or replace an inventory product image")
    public InventoryImageResponse uploadImage(
            @PathVariable Long productId,
            @RequestParam("file") MultipartFile file
    ) {
        return inventoryImageService.upload(productId, file);
    }

    @GetMapping("/admin/reservations/orders/{orderNumber}")
    @Operation(summary = "Get inventory reservation state for an order")
    public InventoryReservationResponse getReservationByOrder(@PathVariable String orderNumber) {
        return inventoryService.getReservationByOrderNumber(orderNumber);
    }
}
