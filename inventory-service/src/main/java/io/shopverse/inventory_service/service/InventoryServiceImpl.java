package io.shopverse.inventory_service.service;

import io.shopverse.inventory_service.dto.InventoryResponse;
import io.shopverse.inventory_service.config.InventoryProperties;
import io.shopverse.inventory_service.dto.InventoryUpsertRequest;
import io.shopverse.inventory_service.entity.InventoryItem;
import io.shopverse.inventory_service.entity.InventoryReservation;
import io.shopverse.inventory_service.entity.ReservationStatus;
import io.shopverse.inventory_service.exception.ResourceNotFoundException;
import io.shopverse.inventory_service.repository.InventoryItemRepository;
import io.shopverse.inventory_service.repository.InventoryReservationRepository;
import io.shopverse.inventory_service.saga.InventoryFailedEvent;
import io.shopverse.inventory_service.saga.InventorySagaPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.scheduling.annotation.Scheduled;
import io.micrometer.core.instrument.MeterRegistry;

import java.util.List;
import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InventoryServiceImpl implements InventoryService {

    private final InventoryItemRepository itemRepository;
    private final InventoryReservationRepository reservationRepository;
    private final InventoryProperties inventoryProperties;
    private final InventorySagaPublisher sagaPublisher;
    private final MeterRegistry meterRegistry;

    @Override
    @Transactional
    @CacheEvict(cacheNames = "inventory", allEntries = true)
    public InventoryResponse upsert(InventoryUpsertRequest request) {
        InventoryItem item = itemRepository.findByProductId(request.productId())
                .map(existing -> {
                    existing.replaceStock(request.productName(), request.unitPrice(), request.availableQuantity());
                    return existing;
                })
                .orElseGet(() -> new InventoryItem(
                        request.productId(),
                        request.productName(),
                        request.unitPrice(),
                        request.availableQuantity()
                ));
        return toResponse(itemRepository.save(item));
    }

    @Override
    @Cacheable(cacheNames = "inventory", key = "#productId")
    public InventoryResponse getByProductId(Long productId) {
        return toResponse(findItem(productId));
    }

    @Override
    public List<InventoryResponse> getAll() {
        return itemRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = "inventory", allEntries = true)
    public boolean reserve(String orderNumber, String correlationId, Long productId, int quantity) {
        if (reservationRepository.findByOrderNumber(orderNumber).isPresent()) {
            return true;
        }
        InventoryItem item = itemRepository.findByProductId(productId).orElse(null);
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
        reservationRepository.findByOrderNumber(orderNumber)
                .filter(reservation -> reservation.getStatus() == ReservationStatus.RESERVED)
                .ifPresent(reservation -> {
                    findItem(reservation.getProductId()).release(reservation.getQuantity());
                    reservation.release();
                });
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
            findItem(reservation.getProductId()).release(reservation.getQuantity());
            reservation.expire();
            sagaPublisher.publishFailed(new InventoryFailedEvent(
                    null,
                    reservation.getOrderNumber(),
                    reservation.getCorrelationId(),
                    "Inventory reservation expired before payment completed"
            ));
            meterRegistry.counter("shopverse.inventory.reservations.expired").increment();
            log.atWarn()
                    .addKeyValue("orderNumber", reservation.getOrderNumber())
                    .addKeyValue("correlationId", reservation.getCorrelationId())
                    .log("Inventory reservation expired and stock was released");
        });
        return expired.size();
    }

    private InventoryItem findItem(Long productId) {
        return itemRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found: " + productId));
    }

    private InventoryResponse toResponse(InventoryItem item) {
        return new InventoryResponse(
                item.getId(),
                item.getProductId(),
                item.getProductName(),
                item.getUnitPrice(),
                item.getAvailableQuantity(),
                item.getReservedQuantity(),
                item.getAvailableQuantity() > 0,
                item.getUpdatedAt()
        );
    }
}
