package io.shopverse.inventory_service.service.catalog;

import io.shopverse.inventory_service.dto.InventoryResponse;
import io.shopverse.inventory_service.dto.InventoryUpsertRequest;

import java.util.List;

public interface InventoryCatalogService {

    InventoryResponse upsert(InventoryUpsertRequest request);

    InventoryResponse getByProductId(Long productId);

    List<InventoryResponse> getAll();

    List<String> getCategories();

    List<InventoryResponse> getRelated(Long productId);
}
