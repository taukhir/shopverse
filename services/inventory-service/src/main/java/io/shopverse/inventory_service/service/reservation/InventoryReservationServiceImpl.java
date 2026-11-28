package io.shopverse.inventory_service.service.reservation;

import io.micrometer.core.instrument.MeterRegistry;
import io.shopverse.inventory_service.config.InventoryProperties;
import io.shopverse.inventory_service.config.KafkaTopicsProperties;
import io.shopverse.inventory_service.dto.InventoryReservationResponse;
import io.shopverse.inventory_service.entity.InventoryItem;
import io.shopverse.inventory_service.entity.InventoryReservation;
import io.shopverse.inventory_service.entity.ReservationStatus;
import io.shopverse.inventory_service.exception.ResourceNotFoundException;
import io.shopverse.inventory_service.outbox.OutboxService;
import io.shopverse.inventory_service.repository.InventoryItemRepository;
import io.shopverse.inventory_service.repository.InventoryReservationRepository;
import io.shopverse.inventory_service.saga.InventoryFailedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InventoryReservationServiceImpl implements InventoryReservationService {

    private final InventoryItemRepository itemRepository;
    private final InventoryReservationRepository reservationRepository;
    private final InventoryProperties inventoryProperties;
    private final OutboxService outboxService;
    private final KafkaTopicsProperties topics;
    private final MeterRegistry meterRegistry;

    @Override
    public InventoryReservationResponse getReservationByOrderNumber(String orderNumber) {
        InventoryReservation reservation = reservationRepository.findFirstByOrderNumberOrderById(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Inventory reservation not found for order: " + orderNumber));
        return toReservationResponse(reservation);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = "inventory", allEntries = true)
    public boolean reserve(String orderNumber, String correlationId, Long productId, int quantity) {
        var existingReservation = reservationRepository.findByOrderNumberAndProductId(orderNumber, productId);
        if (existingReservation.isPresent()) {
            // A replay is successful only while the original reservation is still active.
            // Released/expired reservations must never recreate a successful inventory outcome.
            return existingReservation.get().getStatus() == ReservationStatus.RESERVED;
        }

        InventoryItem item = itemRepository.findByProductIdForUpdate(productId).orElse(null);
        if (item == null) {
            meterRegistry.counter("shopverse.inventory.reservation.conflicts", "reason", "PRODUCT_NOT_FOUND")
                    .increment();
            return false;
        }
        if (!item.canReserve(quantity)) {
            meterRegistry.counter("shopverse.inventory.reservation.conflicts", "reason", "INSUFFICIENT_STOCK")
                    .increment();
            return false;
        }

        item.reserve(quantity);
        itemRepository.saveAndFlush(item);
        reservationRepository.save(new InventoryReservation(
                orderNumber,
                correlationId,
                productId,
                quantity,
                inventoryProperties.reservationTtl()
        ));
        log.atInfo().addKeyValue("orderNumber", orderNumber)
                .addKeyValue("correlationId", correlationId)
                .addKeyValue("productId", productId)
                .log("Inventory reserved");
        return true;
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = "inventory", allEntries = true)
    public void release(String orderNumber) {
        reservationRepository.findAllByOrderNumber(orderNumber).stream()
                .filter(reservation -> reservation.getStatus() == ReservationStatus.RESERVED)
                .forEach(reservation -> {
                    findItemForUpdate(reservation.getProductId()).release(reservation.getQuantity());
                    reservation.release();
                });
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = "inventory", allEntries = true)
    public void release(String orderNumber, Long productId) {
        reservationRepository.findByOrderNumberAndProductId(orderNumber, productId)
                .filter(reservation -> reservation.getStatus() == ReservationStatus.RESERVED)
                .ifPresent(reservation -> {
                    findItemForUpdate(reservation.getProductId()).release(reservation.getQuantity());
                    reservation.release();
                });
    }

    @Override
    @Transactional
    public void confirmReservation(String orderNumber) {
        reservationRepository.findAllByOrderNumberForUpdate(orderNumber).stream()
                .filter(reservation -> reservation.getStatus() == ReservationStatus.RESERVED)
                .forEach(InventoryReservation::confirm);
    }

    @Override
    @Transactional
    @Scheduled(fixedDelayString = "${shopverse.inventory.expiry-scan-delay-ms:60000}")
    @CacheEvict(cacheNames = "inventory", allEntries = true)
    public int expireReservations() {
        List<InventoryReservation> expired = reservationRepository.findAllByStatusAndExpiresAtBefore(
                ReservationStatus.RESERVED,
                Instant.now()
        );
        expired.forEach(reservation -> {
            findItemForUpdate(reservation.getProductId()).release(reservation.getQuantity());
            reservation.expire();
            meterRegistry.counter("shopverse.inventory.reservations.expired").increment();
            log.atWarn()
                    .addKeyValue("orderNumber", reservation.getOrderNumber())
                    .addKeyValue("correlationId", reservation.getCorrelationId())
                    .log("Inventory reservation expired and stock was released");
        });
        expired.stream()
                .collect(Collectors.groupingBy(InventoryReservation::getOrderNumber))
                .forEach((orderNumber, rows) -> {
                    InventoryReservation first = rows.get(0);
                    InventoryFailedEvent event = new InventoryFailedEvent(
                            null,
                            orderNumber,
                            first.getCorrelationId(),
                            "Inventory reservation expired before payment completed",
                            rows.stream().map(InventoryReservation::getProductId).toList()
                    );
                    outboxService.enqueue(
                            "INVENTORY_RESERVATION",
                            orderNumber,
                            InventoryFailedEvent.class.getSimpleName(),
                            topics.inventoryFailed(),
                            orderNumber,
                            event,
                            first.getCorrelationId()
                    );
                });
        return expired.size();
    }

    private InventoryItem findItemForUpdate(Long productId) {
        return itemRepository.findByProductIdForUpdate(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found: " + productId));
    }

    private InventoryReservationResponse toReservationResponse(InventoryReservation reservation) {
        return new InventoryReservationResponse(
                reservation.getId(),
                reservation.getOrderNumber(),
                reservation.getCorrelationId(),
                reservation.getProductId(),
                reservation.getQuantity(),
                reservation.getStatus().name(),
                reservation.getExpiresAt()
        );
    }
}
