package io.shopverse.inventory_service.service;

import io.shopverse.inventory_service.dto.InventoryResponse;
import io.shopverse.inventory_service.dto.InventoryReservationResponse;
import io.shopverse.inventory_service.dto.InventoryUpsertRequest;

import java.util.List;

public interface InventoryService {

    InventoryResponse upsert(InventoryUpsertRequest request);

    InventoryResponse getByProductId(Long productId);

    List<InventoryResponse> getAll();

    List<String> getCategories();

    List<InventoryResponse> getRelated(Long productId);

    InventoryReservationResponse getReservationByOrderNumber(String orderNumber);

    boolean reserve(String orderNumber, String correlationId, Long productId, int quantity);

    void release(String orderNumber);

    int expireReservations();
}
