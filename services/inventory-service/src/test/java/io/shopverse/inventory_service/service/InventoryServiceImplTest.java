package io.shopverse.inventory_service.service;

import io.shopverse.inventory_service.config.InventoryProperties;
import io.shopverse.inventory_service.config.KafkaTopicsProperties;
import io.shopverse.inventory_service.entity.InventoryItem;
import io.shopverse.inventory_service.entity.InventoryReservation;
import io.shopverse.inventory_service.entity.ReservationStatus;
import io.shopverse.inventory_service.outbox.OutboxService;
import io.shopverse.inventory_service.repository.InventoryItemRepository;
import io.shopverse.inventory_service.repository.InventoryReservationRepository;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class InventoryServiceImplTest {

    private final InventoryItemRepository itemRepository = mock(InventoryItemRepository.class);
    private final InventoryReservationRepository reservationRepository = mock(InventoryReservationRepository.class);
    private final InventoryProperties inventoryProperties = new InventoryProperties(Duration.ofMinutes(5), 60000);
    private final OutboxService outboxService = mock(OutboxService.class);
    private final KafkaTopicsProperties topics = new KafkaTopicsProperties(
            "shopverse.order.created",
            "shopverse.inventory.reserved",
            "shopverse.inventory.failed",
            "shopverse.payment.completed",
            "shopverse.payment.failed",
            "shopverse.order.cancelled"
    );
    private final InventoryServiceImpl service = new InventoryServiceImpl(
            itemRepository, reservationRepository, inventoryProperties, outboxService, topics, new SimpleMeterRegistry()
    );

    private InventoryItem item(long productId, int available) {
        return new InventoryItem(productId, "Item " + productId, "Brand", "Model", "Category",
                "Description", null, null, BigDecimal.TEN, available);
    }

    @Test
    void reservesEachLineItemIndependentlyUnderTheSameOrderNumber() {
        when(reservationRepository.findByOrderNumberAndProductId("ORD-1", 101L)).thenReturn(Optional.empty());
        when(reservationRepository.findByOrderNumberAndProductId("ORD-1", 102L)).thenReturn(Optional.empty());
        when(itemRepository.findByProductId(101L)).thenReturn(Optional.of(item(101L, 5)));
        when(itemRepository.findByProductId(102L)).thenReturn(Optional.of(item(102L, 5)));

        boolean firstReserved = service.reserve("ORD-1", "corr-1", 101L, 2);
        boolean secondReserved = service.reserve("ORD-1", "corr-1", 102L, 1);

        assertThat(firstReserved).isTrue();
        assertThat(secondReserved).isTrue();
        verify(reservationRepository, times(2)).save(any(InventoryReservation.class));
    }

    @Test
    void releaseByOrderNumberReleasesEveryReservedRowForThatOrder() {
        InventoryReservation first = new InventoryReservation("ORD-2", "corr-2", 201L, 2, Duration.ofMinutes(5));
        InventoryReservation second = new InventoryReservation("ORD-2", "corr-2", 202L, 1, Duration.ofMinutes(5));
        when(reservationRepository.findAllByOrderNumber("ORD-2")).thenReturn(List.of(first, second));
        when(itemRepository.findByProductId(201L)).thenReturn(Optional.of(item(201L, 0)));
        when(itemRepository.findByProductId(202L)).thenReturn(Optional.of(item(202L, 0)));

        service.release("ORD-2");

        assertThat(first.getStatus()).isEqualTo(ReservationStatus.RELEASED);
        assertThat(second.getStatus()).isEqualTo(ReservationStatus.RELEASED);
    }

    @Test
    void releaseByOrderNumberAndProductIdReleasesOnlyThatLineItem() {
        InventoryReservation target = new InventoryReservation("ORD-3", "corr-3", 301L, 2, Duration.ofMinutes(5));
        when(reservationRepository.findByOrderNumberAndProductId("ORD-3", 301L)).thenReturn(Optional.of(target));
        when(itemRepository.findByProductId(301L)).thenReturn(Optional.of(item(301L, 0)));

        service.release("ORD-3", 301L);

        assertThat(target.getStatus()).isEqualTo(ReservationStatus.RELEASED);
        verify(reservationRepository, never()).findAllByOrderNumber(any());
    }

    @Test
    void confirmReservationConfirmsEveryReservedRowForThatOrder() {
        InventoryReservation first = new InventoryReservation("ORD-4", "corr-4", 401L, 1, Duration.ofMinutes(5));
        InventoryReservation second = new InventoryReservation("ORD-4", "corr-4", 402L, 1, Duration.ofMinutes(5));
        when(reservationRepository.findAllByOrderNumberForUpdate("ORD-4")).thenReturn(List.of(first, second));

        service.confirmReservation("ORD-4");

        assertThat(first.getStatus()).isEqualTo(ReservationStatus.CONFIRMED);
        assertThat(second.getStatus()).isEqualTo(ReservationStatus.CONFIRMED);
    }

    @Test
    void expiryGroupsMultipleRowsPerOrderIntoOneConsolidatedFailedEvent() {
        InventoryReservation rowA = new InventoryReservation("ORD-5", "corr-5", 501L, 1, Duration.ofMinutes(-1));
        InventoryReservation rowB = new InventoryReservation("ORD-5", "corr-5", 502L, 3, Duration.ofMinutes(-1));
        when(reservationRepository.findAllByStatusAndExpiresAtBefore(eq(ReservationStatus.RESERVED), any(Instant.class)))
                .thenReturn(List.of(rowA, rowB));
        when(itemRepository.findByProductId(501L)).thenReturn(Optional.of(item(501L, 0)));
        when(itemRepository.findByProductId(502L)).thenReturn(Optional.of(item(502L, 0)));

        int expiredCount = service.expireReservations();

        assertThat(expiredCount).isEqualTo(2);
        assertThat(rowA.getStatus()).isEqualTo(ReservationStatus.EXPIRED);
        assertThat(rowB.getStatus()).isEqualTo(ReservationStatus.EXPIRED);
        verify(outboxService, times(1)).enqueue(
                any(), eq("ORD-5"), eq("InventoryFailedEvent"), eq("shopverse.inventory.failed"),
                eq("ORD-5"), any(), eq("corr-5")
        );
    }
}
