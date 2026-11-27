package io.shopverse.order.service;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import io.shopverse.order.config.KafkaTopicsProperties;
import io.shopverse.order.dto.CatalogItemResponse;
import io.shopverse.order.dto.AdminOrderSummaryResponse;
import io.shopverse.order.dto.CheckoutItemRequest;
import io.shopverse.order.dto.CheckoutRequest;
import io.shopverse.order.dto.ShippingAddressRequest;
import io.shopverse.order.entity.OrderEntity;
import io.shopverse.order.entity.OrderStatus;
import io.shopverse.order.exception.ResourceNotFoundException;
import io.shopverse.order.outbox.OutboxService;
import io.shopverse.order.repository.OrderRepository;
import io.shopverse.order.repository.OrderTimelineRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class OrderServiceImplTest {

    private final OrderRepository repository = mock(OrderRepository.class);
    private final OrderTimelineRepository timelineRepository = mock(OrderTimelineRepository.class);
    private final CatalogService catalogService = mock(CatalogService.class);
    private final OutboxService outboxService = mock(OutboxService.class);
    private final KafkaTopicsProperties topics = new KafkaTopicsProperties(
            "shopverse.order.created",
            "shopverse.inventory.reserved",
            "shopverse.inventory.failed",
            "shopverse.payment.completed",
            "shopverse.payment.failed",
            "shopverse.order.cancelled"
    );
    private final OrderServiceImpl service = new OrderServiceImpl(
            repository,
            timelineRepository,
            new CheckoutItemValidator(catalogService),
            new SimpleMeterRegistry(),
            outboxService,
            topics
    );

    @Test
    void adminOrderSearchReturnsRequestedBoundedPageAndSummaryFields() {
        var order = new OrderEntity("ORD-SEARCH", "customer.one", "correlation-search", "idempotency-search");
        order.markPaymentFailed("declined");
        when(repository.findAdminOrders(eq("customer"), eq(OrderStatus.PAYMENT_FAILED), any()))
                .thenReturn(new PageImpl<>(List.of(order), PageRequest.of(1, 8), 17));

        var response = service.getAdminOrders(1, 8, " customer ", "PAYMENT_FAILED", "totalAmount", "ASC");

        assertThat(response.content()).singleElement().satisfies(summary -> {
            assertThat(summary).isInstanceOf(AdminOrderSummaryResponse.class);
            assertThat(summary.orderNumber()).isEqualTo("ORD-SEARCH");
            assertThat(summary.customerUsername()).isEqualTo("customer.one");
            assertThat(summary.status()).isEqualTo("PAYMENT_FAILED");
        });
        assertThat(response.page()).isEqualTo(1);
        assertThat(response.size()).isEqualTo(8);
        assertThat(response.totalElements()).isEqualTo(17);
        verify(repository).findAdminOrders(eq("customer"), eq(OrderStatus.PAYMENT_FAILED), eq(PageRequest.of(1, 8, Sort.by(Sort.Direction.ASC, "totalAmount").and(Sort.by(Sort.Direction.DESC, "id")))));
    }

    @Test
    void adminOrderPageRejectsUnsupportedSortField() {
        assertThatThrownBy(() -> service.getAdminOrders(0, 20, "", "ALL", "idempotencyKey", "DESC"))
                .hasMessageContaining("Sorting is not supported");
    }

    @Test
    void checkoutValidatesRequestedProductWithDirectInventoryLookup() {
        when(repository.findWithItemsByIdempotencyKey("checkout-103")).thenReturn(Optional.empty());
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(catalogService.getProduct(103L)).thenReturn(new CatalogItemResponse(
                103L,
                "Pulse Fitness Tracker",
                BigDecimal.valueOf(72.49),
                true,
                "http://localhost:9000/shopverse-product-images/products/103.png",
                "products/103.png"
        ));

        var response = service.checkout(
                new CheckoutRequest(List.of(new CheckoutItemRequest(103L, 1)), shippingAddress()),
                "henry.thompson",
                "correlation-103",
                "checkout-103"
        );

        assertThat(response.customerUsername()).isEqualTo("henry.thompson");
        assertThat(response.items()).singleElement().satisfies(item -> {
            assertThat(item.productId()).isEqualTo(103L);
            assertThat(item.productName()).isEqualTo("Pulse Fitness Tracker");
            assertThat(item.unitPrice()).isEqualByComparingTo("72.49");
        });
        verify(catalogService).getProduct(103L);
        verify(catalogService, never()).getCatalog();
        verify(outboxService).enqueue(
                eq("ORDER"),
                any(),
                eq("OrderCreatedEvent"),
                eq("shopverse.order.created"),
                any(),
                any(),
                eq("correlation-103")
        );
    }

    @Test
    void checkoutRejectsUnavailableProductBeforePersistingOrder() {
        when(repository.findWithItemsByIdempotencyKey("checkout-103")).thenReturn(Optional.empty());
        when(catalogService.getProduct(103L)).thenReturn(new CatalogItemResponse(
                103L,
                "Pulse Fitness Tracker",
                BigDecimal.valueOf(72.49),
                false,
                "http://localhost:9000/shopverse-product-images/products/103.png",
                "products/103.png"
        ));

        assertThatThrownBy(() -> service.checkout(
                new CheckoutRequest(List.of(new CheckoutItemRequest(103L, 1)), shippingAddress()),
                "henry.thompson",
                "correlation-103",
                "checkout-103"
        ))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Product is unavailable or does not exist: 103");

        verify(repository, never()).save(any());
        verify(outboxService, never()).enqueue(any(), any(), any(), any(), any(), any(), any());
        verify(catalogService, never()).getCatalog();
    }

    @Test
    void checkoutTransitionsOrderToPendingInventoryBeforeOutboxEnqueue() {
        // Proves BUG-013's fix: before this, OrderEntity's constructor left every
        // new order at ORDER_CREATED, and nothing ever assigned PENDING_INVENTORY
        // — so the saga guards below could never fire. This assertion failed on
        // the old code.
        when(repository.findWithItemsByIdempotencyKey("checkout-103")).thenReturn(Optional.empty());
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(catalogService.getProduct(103L)).thenReturn(new CatalogItemResponse(
                103L, "Pulse Fitness Tracker", BigDecimal.valueOf(72.49), true,
                "http://localhost:9000/shopverse-product-images/products/103.png", "products/103.png"
        ));

        var response = service.checkout(
                new CheckoutRequest(List.of(new CheckoutItemRequest(103L, 1)), shippingAddress()),
                "henry.thompson",
                "correlation-103",
                "checkout-103"
        );

        assertThat(response.status()).isEqualTo(OrderStatus.PENDING_INVENTORY.name());
    }

    @Test
    void markInventoryReservedAndPaymentProcessingAdvancesFromPendingInventory() {
        OrderEntity order = pendingInventoryOrder();
        when(repository.findWithItemsByOrderNumber("ORD-1")).thenReturn(Optional.of(order));

        service.markInventoryReservedAndPaymentProcessing("ORD-1");

        assertThat(order.getStatus()).isEqualTo(OrderStatus.PAYMENT_PROCESSING);
    }

    @Test
    void markInventoryReservedAndPaymentProcessingIsIdempotentOnRedelivery() {
        // A real at-least-once-delivery case: the same InventoryReservedEvent
        // arrives twice. The first call advances the order; the guard must
        // reject the second call rather than re-applying the transition.
        OrderEntity order = pendingInventoryOrder();
        when(repository.findWithItemsByOrderNumber("ORD-1")).thenReturn(Optional.of(order));

        service.markInventoryReservedAndPaymentProcessing("ORD-1");
        service.markInventoryReservedAndPaymentProcessing("ORD-1");

        assertThat(order.getStatus()).isEqualTo(OrderStatus.PAYMENT_PROCESSING);
        // Exactly 2 timeline entries (INVENTORY_RESERVED + PAYMENT_PROCESSING)
        // from the first call only — the second, redelivered call must no-op.
        verify(timelineRepository, times(2)).save(any());
    }

    private static OrderEntity pendingInventoryOrder() {
        OrderEntity order = new OrderEntity("ORD-1", "henry.thompson", "correlation-1", "checkout-1");
        order.markPendingInventory();
        return order;
    }

    private static ShippingAddressRequest shippingAddress() {
        return new ShippingAddressRequest(
                "Henry Thompson",
                "+919876543210",
                "42 Market Road",
                "Apt 5",
                "Bangalore",
                "Karnataka",
                "560001",
                "India"
        );
    }
}
