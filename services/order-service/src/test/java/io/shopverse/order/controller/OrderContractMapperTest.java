package io.shopverse.order.controller;

import io.shopverse.contracts.order.CheckoutItemRequest;
import io.shopverse.contracts.order.CheckoutRequest;
import io.shopverse.contracts.order.ShippingAddressRequest;
import io.shopverse.order.dto.OrderItemResponse;
import io.shopverse.order.dto.OrderResponse;
import io.shopverse.order.dto.ShippingAddressResponse;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

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
        assertThat(result.getItems()).hasSize(1);
        var resultItem = result.getItems().getFirst();
        var expectedItem = response.items().getFirst();
        assertThat(resultItem.getProductId()).isEqualTo(expectedItem.productId());
        assertThat(resultItem.getProductName()).isEqualTo(expectedItem.productName());
        assertThat(resultItem.getQuantity()).isEqualTo(expectedItem.quantity());
        assertThat(resultItem.getUnitPrice()).isEqualTo(expectedItem.unitPrice().toPlainString());
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
