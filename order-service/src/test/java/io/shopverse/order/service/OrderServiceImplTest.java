package io.shopverse.order.service;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import io.shopverse.order.config.KafkaTopicsProperties;
import io.shopverse.order.dto.CatalogItemResponse;
import io.shopverse.order.dto.CheckoutItemRequest;
import io.shopverse.order.dto.CheckoutRequest;
import io.shopverse.order.dto.ShippingAddressRequest;
import io.shopverse.order.exception.ResourceNotFoundException;
import io.shopverse.order.outbox.OutboxService;
import io.shopverse.order.repository.OrderRepository;
import io.shopverse.order.repository.OrderTimelineRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
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
            "shopverse.payment.failed"
    );
    private final OrderServiceImpl service = new OrderServiceImpl(
            repository,
            timelineRepository,
            catalogService,
            new SimpleMeterRegistry(),
            outboxService,
            topics
    );

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
