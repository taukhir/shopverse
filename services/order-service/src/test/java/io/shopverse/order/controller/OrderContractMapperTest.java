package io.shopverse.order.controller;

import io.shopverse.contracts.order.CheckoutItemRequest;
import io.shopverse.contracts.order.CheckoutRequest;
import io.shopverse.contracts.order.ShippingAddressRequest;
import io.shopverse.order.dto.CheckoutResponse;
import io.shopverse.order.dto.OrderItemResponse;
import io.shopverse.order.dto.OrderResponse;
import io.shopverse.order.dto.ShippingAddressResponse;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Objects;

import static org.assertj.core.api.Assertions.assertThat;

class OrderContractMapperTest {

    private final OrderContractMapper mapper = Mappers.getMapper(OrderContractMapper.class);

    @Test
    void checkoutMappingPreservesEveryItemAndAddressField() {
        var request = new CheckoutRequest(
                List.of(new CheckoutItemRequest(101L, 2), new CheckoutItemRequest(102L, 3)),
                new ShippingAddressRequest("Test Customer", "+919876543210", "12 Test Road",
                        "Unit 4", "Bengaluru", "Karnataka", "560001", "IN")
        );

        var result = mapper.toApplication(request);

        // Mapping preserves data; HTTP validation separately enforces the one-item limit.
        assertThat(result.items()).containsExactly(
                new io.shopverse.order.dto.CheckoutItemRequest(101L, 2),
                new io.shopverse.order.dto.CheckoutItemRequest(102L, 3)
        );
        assertThat(result.shippingAddress()).isEqualTo(
                new io.shopverse.order.dto.ShippingAddressRequest("Test Customer", "+919876543210",
                        "12 Test Road", "Unit 4", "Bengaluru", "Karnataka", "560001", "IN")
        );
    }

    @Test
    void responseMappingPreservesIdentifiersNestedValuesMoneyAndTimestamp() {
        Instant createdAt = Instant.parse("2026-11-17T12:34:56.123456Z");
        var response = new OrderResponse(7L, "ORD-TEST", "corr-test", "checkout-test", "alice",
                "PENDING_INVENTORY", "INR", new BigDecimal("123456789012345.67"),
                new ShippingAddressResponse("Test Customer", "+919876543210", "12 Test Road",
                        "Unit 4", "Bengaluru", "Karnataka", "560001", "IN"),
                List.of(new OrderItemResponse(101L, "Test Product", 2, new BigDecimal("19.90"))),
                createdAt);

        var result = mapper.toContract(response);

        assertThat(result.getId()).isEqualTo(7L);
        assertThat(result.getOrderNumber()).isEqualTo("ORD-TEST");
        assertThat(result.getCorrelationId()).isEqualTo("corr-test");
        assertThat(result.getIdempotencyKey()).isEqualTo("checkout-test");
        assertThat(result.getCustomerUsername()).isEqualTo("alice");
        assertThat(result.getStatus()).isEqualTo("PENDING_INVENTORY");
        assertThat(result.getCurrency()).isEqualTo("INR");
        assertThat(result.getTotalAmount()).isEqualTo(response.totalAmount().toPlainString());
        assertThat(result.getCreatedAt()).isEqualTo(createdAt);
        assertThat(result.getShippingAddress()).usingRecursiveComparison()
                .isEqualTo(response.shippingAddress());
        var resultItems = Objects.requireNonNull(result.getItems());
        assertThat(resultItems).hasSize(1);
        var resultItem = resultItems.getFirst();
        var expectedItem = response.items().getFirst();
        assertThat(resultItem.getProductId()).isEqualTo(expectedItem.productId());
        assertThat(resultItem.getProductName()).isEqualTo(expectedItem.productName());
        assertThat(resultItem.getQuantity()).isEqualTo(expectedItem.quantity());
        assertThat(resultItem.getUnitPrice()).isEqualTo(expectedItem.unitPrice().toPlainString());
    }

    @Test
    void checkoutResponseMappingPreservesItemsAddressVersionStatusAndExpiry() {
        Instant expiresAt = Instant.parse("2026-11-17T12:49:56.123456Z");
        var checkout = new CheckoutResponse("CHK-TEST", 1L, "READY_TO_PLACE",
                List.of(new OrderItemResponse(101L, "Test Product", 2, new BigDecimal("19.90"))),
                new ShippingAddressResponse("Test Customer", "+919876543210", "12 Test Road",
                        "Unit 4", "Bengaluru", "Karnataka", "560001", "IN"),
                "INR", new BigDecimal("39.80"), expiresAt, null);

        var result = mapper.toContract(checkout);

        assertThat(result.getCheckoutId()).isEqualTo("CHK-TEST");
        assertThat(result.getVersion()).isEqualTo(1L);
        assertThat(result.getStatus()).isEqualTo("READY_TO_PLACE");
        assertThat(result.getTotalAmount()).isEqualTo("39.80");
        assertThat(result.getCurrency()).isEqualTo("INR");
        assertThat(result.getExpiresAt()).isEqualTo(expiresAt);
        assertThat(result.getOrderId()).isNull();
        assertThat(result.getShippingAddress()).usingRecursiveComparison()
                .isEqualTo(checkout.shippingAddress());
        var resultItem = Objects.requireNonNull(result.getItems()).getFirst();
        assertThat(resultItem.getProductId()).isEqualTo(101L);
        assertThat(resultItem.getQuantity()).isEqualTo(2);
        assertThat(resultItem.getUnitPrice()).isEqualTo("19.90");
    }

    @Test
    void placeOrderRequestMappingPreservesCheckoutVersion() {
        var result = mapper.toApplication(new io.shopverse.contracts.order.PlaceOrderRequest(3L));

        assertThat(result.checkoutVersion()).isEqualTo(3L);
    }

    @Test
    void updateCheckoutRequestMappingPreservesVersionItemsAndAddress() {
        var request = new io.shopverse.contracts.order.UpdateCheckoutRequest(
                3L,
                List.of(new CheckoutItemRequest(101L, 2)),
                new ShippingAddressRequest("Test Customer", "+919876543210", "12 Test Road",
                        "Unit 4", "Bengaluru", "Karnataka", "560001", "IN")
        );

        var result = mapper.toApplication(request);

        assertThat(result.checkoutVersion()).isEqualTo(3L);
        assertThat(result.items()).containsExactly(new io.shopverse.order.dto.CheckoutItemRequest(101L, 2));
        assertThat(result.shippingAddress()).isEqualTo(
                new io.shopverse.order.dto.ShippingAddressRequest("Test Customer", "+919876543210",
                        "12 Test Road", "Unit 4", "Bengaluru", "Karnataka", "560001", "IN"));
    }

    @Test
    void timelineMappingPreservesStageDetailAndTimestamp() {
        var response = new io.shopverse.order.dto.OrderTimelineResponse("ORD-TEST", "corr-test",
                "ORDER_CREATED", "Checkout accepted", Instant.parse("2026-11-17T12:34:56.123456Z"));

        assertThat(mapper.toContract(response)).usingRecursiveComparison().isEqualTo(response);
    }

    @Test
    void catalogMappingPreservesPriceAvailabilityAndImageFields() {
        var response = new io.shopverse.order.dto.CatalogItemResponse(101L, "Test Product",
                new BigDecimal("19.90"), false, "/images/test-product.png", "products/test-product.png");

        assertThat(mapper.toContract(response)).usingRecursiveComparison().isEqualTo(response);
    }

    @Test
    void optionalAddressFieldsRemainNull() {
        var result = mapper.toApplication(new CheckoutRequest(List.of(new CheckoutItemRequest(101L, 1)),
                new ShippingAddressRequest("Test Customer", null, "12 Test Road", null,
                        "Bengaluru", "Karnataka", "560001", "IN")));

        assertThat(result.shippingAddress().phoneNumber()).isNull();
        assertThat(result.shippingAddress().line2()).isNull();
    }
}
