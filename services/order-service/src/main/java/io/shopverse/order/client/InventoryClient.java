package io.shopverse.order.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "INVENTORY-SERVICE")
public interface InventoryClient {

    @GetMapping("/api/v1/inventory/public/items")
    List<InventoryCatalogItem> getCatalog();

    @GetMapping("/api/v1/inventory/public/items/{productId}")
    InventoryCatalogItem getCatalogItem(@PathVariable Long productId);
}
