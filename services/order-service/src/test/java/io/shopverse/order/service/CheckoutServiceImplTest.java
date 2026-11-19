package io.shopverse.order.service;

import io.shopverse.order.dto.CatalogItemResponse;
import io.shopverse.order.dto.CheckoutItemRequest;
import io.shopverse.order.dto.CheckoutRequest;
import io.shopverse.order.dto.OrderResponse;
import io.shopverse.order.dto.PlaceOrderRequest;
import io.shopverse.order.dto.ShippingAddressRequest;
import io.shopverse.order.entity.CheckoutEntity;
import io.shopverse.order.exception.CheckoutAlreadyPlacedException;
import io.shopverse.order.exception.CheckoutExpiredException;
import io.shopverse.order.exception.CheckoutVersionMismatchException;
import io.shopverse.order.exception.ResourceNotFoundException;
import io.shopverse.order.repository.CheckoutRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
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

class CheckoutServiceImplTest {

    private final CheckoutRepository repository = mock(CheckoutRepository.class);
    private final CatalogService catalogService = mock(CatalogService.class);
    private final OrderService orderService = mock(OrderService.class);
    private final CheckoutServiceImpl service = new CheckoutServiceImpl(
            repository,
            new CheckoutItemValidator(catalogService),
            orderService
    );

    @Test
    void createCheckoutPersistsComputedTotalsAndReadyToPlaceStatus() {
        when(catalogService.getProduct(103L)).thenReturn(new CatalogItemResponse(
                103L, "Pulse Fitness Tracker", BigDecimal.valueOf(72.49), true,
                "http://localhost:9000/shopverse-product-images/products/103.png", "products/103.png"
        ));
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.createCheckout(
                new CheckoutRequest(List.of(new CheckoutItemRequest(103L, 2)), shippingAddress()),
                "henry.thompson"
        );

        assertThat(response.checkoutId()).startsWith("CHK-");
        assertThat(response.version()).isEqualTo(1L);
        assertThat(response.status()).isEqualTo("READY_TO_PLACE");
        assertThat(response.items()).singleElement().satisfies(item -> {
            assertThat(item.productId()).isEqualTo(103L);
            assertThat(item.quantity()).isEqualTo(2);
            assertThat(item.unitPrice()).isEqualByComparingTo("72.49");
        });
        assertThat(response.totalAmount()).isEqualByComparingTo("144.98");
        assertThat(response.shippingAddress().recipientName()).isEqualTo("Henry Thompson");
        assertThat(response.orderId()).isNull();
    }

    @Test
    void createCheckoutRejectsUnavailableProductWithoutPersistingAnything() {
        when(catalogService.getProduct(103L)).thenReturn(new CatalogItemResponse(
                103L, "Pulse Fitness Tracker", BigDecimal.valueOf(72.49), false,
                "http://localhost:9000/shopverse-product-images/products/103.png", "products/103.png"
        ));

        assertThatThrownBy(() -> service.createCheckout(
                new CheckoutRequest(List.of(new CheckoutItemRequest(103L, 1)), shippingAddress()),
                "henry.thompson"
        )).isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Product is unavailable or does not exist: 103");

        verify(repository, never()).save(any());
    }

    @Test
    void placeOrderCallsOrderServiceAndMarksCheckoutPlaced() {
        CheckoutEntity checkout = readyCheckout();
        when(repository.findWithItemsByCheckoutNumberAndCustomerUsername("CHK-1", "henry.thompson"))
                .thenReturn(Optional.of(checkout));
        OrderResponse order = orderResponse(55L);
        when(orderService.checkout(any(), eq("henry.thompson"), eq("corr-1"), eq("idem-1"))).thenReturn(order);

        var result = service.placeOrder("CHK-1", new PlaceOrderRequest(1L), "henry.thompson", "corr-1", "idem-1");

        assertThat(result).isEqualTo(order);
        assertThat(checkout.isPlaced()).isTrue();
        assertThat(checkout.getOrderId()).isEqualTo(55L);
    }

    @Test
    void placeOrderReplaysSameIdempotencyKeyWithoutCreatingAnotherOrder() {
        CheckoutEntity checkout = readyCheckout();
        checkout.markPlaced(55L, "idem-1", Instant.now());
        when(repository.findWithItemsByCheckoutNumberAndCustomerUsername("CHK-1", "henry.thompson"))
                .thenReturn(Optional.of(checkout));
        OrderResponse order = orderResponse(55L);
        when(orderService.getOrder(55L)).thenReturn(order);

        var result = service.placeOrder("CHK-1", new PlaceOrderRequest(1L), "henry.thompson", "corr-1", "idem-1");

        assertThat(result).isEqualTo(order);
        verify(orderService, never()).checkout(any(), any(), any(), any());
    }

    @Test
    void placeOrderRejectsDifferentKeyOnAnAlreadyPlacedCheckout() {
        CheckoutEntity checkout = readyCheckout();
        checkout.markPlaced(55L, "idem-1", Instant.now());
        when(repository.findWithItemsByCheckoutNumberAndCustomerUsername("CHK-1", "henry.thompson"))
                .thenReturn(Optional.of(checkout));

        assertThatThrownBy(() -> service.placeOrder("CHK-1", new PlaceOrderRequest(1L), "henry.thompson", "corr-1", "idem-2"))
                .isInstanceOf(CheckoutAlreadyPlacedException.class);

        verify(orderService, never()).checkout(any(), any(), any(), any());
    }

    @Test
    void placeOrderRejectsAStaleCheckoutVersion() {
        CheckoutEntity checkout = readyCheckout();
        when(repository.findWithItemsByCheckoutNumberAndCustomerUsername("CHK-1", "henry.thompson"))
                .thenReturn(Optional.of(checkout));

        assertThatThrownBy(() -> service.placeOrder("CHK-1", new PlaceOrderRequest(2L), "henry.thompson", "corr-1", "idem-1"))
                .isInstanceOf(CheckoutVersionMismatchException.class);

        verify(orderService, never()).checkout(any(), any(), any(), any());
    }

    @Test
    void placeOrderRejectsAnExpiredUnplacedCheckout() {
        CheckoutEntity checkout = new CheckoutEntity("CHK-1", "henry.thompson", Instant.now().minusSeconds(1));
        checkout.setShippingAddress("Henry Thompson", null, "42 Market Road", null, "Bangalore", "Karnataka", "560001", "India");
        checkout.addItem(103L, "Pulse Fitness Tracker", 1, BigDecimal.valueOf(72.49));
        when(repository.findWithItemsByCheckoutNumberAndCustomerUsername("CHK-1", "henry.thompson"))
                .thenReturn(Optional.of(checkout));

        assertThatThrownBy(() -> service.placeOrder("CHK-1", new PlaceOrderRequest(1L), "henry.thompson", "corr-1", "idem-1"))
                .isInstanceOf(CheckoutExpiredException.class);

        verify(orderService, never()).checkout(any(), any(), any(), any());
    }

    @Test
    void placeOrderRejectsAMissingOrUnownedCheckout() {
        when(repository.findWithItemsByCheckoutNumberAndCustomerUsername("CHK-1", "henry.thompson"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.placeOrder("CHK-1", new PlaceOrderRequest(1L), "henry.thompson", "corr-1", "idem-1"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    private static CheckoutEntity readyCheckout() {
        CheckoutEntity checkout = new CheckoutEntity("CHK-1", "henry.thompson", Instant.now().plusSeconds(900));
        checkout.setShippingAddress("Henry Thompson", null, "42 Market Road", null, "Bangalore", "Karnataka", "560001", "India");
        checkout.addItem(103L, "Pulse Fitness Tracker", 1, BigDecimal.valueOf(72.49));
        return checkout;
    }

    private static OrderResponse orderResponse(Long id) {
        return new OrderResponse(id, "ORD-1", "corr-1", "idem-1", "henry.thompson",
                "PENDING_INVENTORY", "INR", BigDecimal.valueOf(72.49), null, List.of(), Instant.now());
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
