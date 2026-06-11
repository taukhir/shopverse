package io.shopverse.inventory_service.repository;

import io.shopverse.inventory_service.entity.InventoryReservation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.time.Instant;
import java.util.List;

public interface InventoryReservationRepository extends JpaRepository<InventoryReservation, Long> {

    Optional<InventoryReservation> findByOrderNumber(String orderNumber);

    List<InventoryReservation> findAllByStatusAndExpiresAtBefore(
            io.shopverse.inventory_service.entity.ReservationStatus status,
            Instant expiresAt
    );
}
