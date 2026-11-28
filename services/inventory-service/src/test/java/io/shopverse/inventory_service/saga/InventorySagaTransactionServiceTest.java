package io.shopverse.inventory_service.saga;

import io.shopverse.inventory_service.config.KafkaTopicsProperties;
import io.shopverse.inventory_service.outbox.OutboxService;
import io.shopverse.inventory_service.service.reservation.InventoryReservationService;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class InventorySagaTransactionServiceTest {

    private final InventoryReservationService inventoryReservationService = mock(InventoryReservationService.class);
    private final OutboxService outboxService = mock(OutboxService.class);
    private final KafkaTopicsProperties topics = new KafkaTopicsProperties(
            "shopverse.order.created",
            "shopverse.inventory.reserved",
            "shopverse.inventory.failed",
            "shopverse.payment.completed",
            "shopverse.payment.failed",
            "shopverse.order.cancelled"
    );
    private final InventorySagaTransactionService service =
            new InventorySagaTransactionService(inventoryReservationService, outboxService, topics);

    @Test
    void reservesEveryLineItemAndPublishesOneConsolidatedReservedEvent() {
        OrderCreatedEvent event = new OrderCreatedEvent(
                1L, "ORD-1", "corr-1", "jane",
                101L, 2, BigDecimal.valueOf(150),
                List.of(new LineItem(101L, 2), new LineItem(102L, 1))
        );
        when(inventoryReservationService.reserve("ORD-1", "corr-1", 101L, 2)).thenReturn(true);
        when(inventoryReservationService.reserve("ORD-1", "corr-1", 102L, 1)).thenReturn(true);

        service.handleOrderCreated(event);

        verify(inventoryReservationService).reserve("ORD-1", "corr-1", 101L, 2);
        verify(inventoryReservationService).reserve("ORD-1", "corr-1", 102L, 1);
        verify(inventoryReservationService, never()).release(eq("ORD-1"), any());
        verify(outboxService).enqueue(
                eq("INVENTORY_RESERVATION"),
                eq("ORD-1"),
                eq("InventoryReservedEvent"),
                eq("shopverse.inventory.reserved"),
                eq("ORD-1"),
                any(InventoryReservedEvent.class),
                eq("corr-1")
        );
    }

    @Test
    void partialFailureCompensatesAlreadyReservedItemsAndPublishesOneFailedEvent() {
        OrderCreatedEvent event = new OrderCreatedEvent(
                1L, "ORD-2", "corr-2", "jane",
                201L, 1, BigDecimal.valueOf(50),
                List.of(new LineItem(201L, 1), new LineItem(202L, 5))
        );
        when(inventoryReservationService.reserve("ORD-2", "corr-2", 201L, 1)).thenReturn(true);
        when(inventoryReservationService.reserve("ORD-2", "corr-2", 202L, 5)).thenReturn(false);

        service.handleOrderCreated(event);

        verify(inventoryReservationService).release("ORD-2", 201L);
        verify(inventoryReservationService, never()).release("ORD-2", 202L);

        var captor = org.mockito.ArgumentCaptor.forClass(InventoryFailedEvent.class);
        verify(outboxService).enqueue(
                eq("INVENTORY_RESERVATION"),
                eq("ORD-2"),
                eq("InventoryFailedEvent"),
                eq("shopverse.inventory.failed"),
                eq("ORD-2"),
                captor.capture(),
                eq("corr-2")
        );
        assertThat(captor.getValue().failedProductIds()).containsExactly(202L);
    }

    @Test
    void legacySingleItemEventWithoutItemsListStillReservesTheScalarPair() {
        OrderCreatedEvent event = new OrderCreatedEvent(
                1L, "ORD-3", "corr-3", "jane",
                301L, 4, BigDecimal.valueOf(20),
                null
        );
        when(inventoryReservationService.reserve("ORD-3", "corr-3", 301L, 4)).thenReturn(true);

        service.handleOrderCreated(event);

        verify(inventoryReservationService).reserve("ORD-3", "corr-3", 301L, 4);
        verify(outboxService).enqueue(
                eq("INVENTORY_RESERVATION"),
                eq("ORD-3"),
                eq("InventoryReservedEvent"),
                eq("shopverse.inventory.reserved"),
                eq("ORD-3"),
                any(InventoryReservedEvent.class),
                eq("corr-3")
        );
    }
}
