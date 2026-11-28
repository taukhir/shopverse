package io.shopverse.inventory_service.service.reservation;

import io.shopverse.inventory_service.dto.InventoryReservationResponse;

public interface InventoryReservationService {

    InventoryReservationResponse getReservationByOrderNumber(String orderNumber);

    boolean reserve(String orderNumber, String correlationId, Long productId, int quantity);

    void release(String orderNumber);

    void release(String orderNumber, Long productId);

    void confirmReservation(String orderNumber);

    int expireReservations();
}
