package io.shopverse.inventory_service.repository;

import io.shopverse.inventory_service.entity.InventoryReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.Optional;
import java.time.Instant;
import java.util.List;

public interface InventoryReservationRepository extends JpaRepository<InventoryReservation, Long> {

    Optional<InventoryReservation> findByOrderNumber(String orderNumber);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from InventoryReservation r where r.orderNumber = :orderNumber")
    Optional<InventoryReservation> findByOrderNumberForUpdate(@Param("orderNumber") String orderNumber);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    List<InventoryReservation> findAllByStatusAndExpiresAtBefore(
            io.shopverse.inventory_service.entity.ReservationStatus status,
            Instant expiresAt
    );
}
