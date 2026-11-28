package io.shopverse.inventory_service.controller;

import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.shopverse.inventory_service.constants.InventoryConstants;
import io.shopverse.inventory_service.dto.InventoryImageResponse;
import io.shopverse.inventory_service.dto.InventoryReservationResponse;
import io.shopverse.inventory_service.dto.InventoryResponse;
import io.shopverse.inventory_service.dto.InventoryUpsertRequest;
import io.shopverse.inventory_service.service.catalog.InventoryCatalogService;
import io.shopverse.inventory_service.service.image.InventoryImageService;
import io.shopverse.inventory_service.service.reservation.InventoryReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping(InventoryConstants.API_ROOT + "/admin")
@Tag(name = "Inventory Administration", description = "Administrative stock, media, and reservation APIs")
@RateLimiter(name = "inventory-api")
@Bulkhead(name = "inventory-api", type = Bulkhead.Type.SEMAPHORE)
public class InventoryAdminController {

    private final InventoryCatalogService inventoryCatalogService;
    private final InventoryReservationService inventoryReservationService;
    private final InventoryImageService inventoryImageService;

    @PutMapping("/items")
    @Operation(summary = "Create or replace product stock")
    public InventoryResponse upsert(@Valid @RequestBody InventoryUpsertRequest request) {
        return inventoryCatalogService.upsert(request);
    }

    @PostMapping("/items/{productId}/image")
    @Operation(summary = "Upload or replace an inventory product image")
    public InventoryImageResponse uploadImage(
            @PathVariable Long productId,
            @RequestParam("file") MultipartFile file
    ) {
        return inventoryImageService.upload(productId, file);
    }

    @GetMapping("/reservations/orders/{orderNumber}")
    @Operation(summary = "Get inventory reservation state for an order")
    public InventoryReservationResponse getReservationByOrder(@PathVariable String orderNumber) {
        return inventoryReservationService.getReservationByOrderNumber(orderNumber);
    }
}
