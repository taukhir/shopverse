package io.shopverse.order.dto;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.ArrayList;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OrderDtoCollectionsTest {

    @Test
    void checkoutItemsCannotBeChangedThroughEitherReference() {
        var item = new CheckoutItemRequest(1L, 1);
        var items = new ArrayList<CheckoutItemRequest>();
        items.add(item);
        var request = new CheckoutRequest(items, null);

        items.clear();

        assertThat(request.items()).containsExactly(item);
        assertThatThrownBy(() -> request.items().clear()).isInstanceOf(UnsupportedOperationException.class);
    }

    @Test
    void malformedCheckoutCollectionsReachBeanValidationWithoutConstructorFailures() {
        assertThat(new CheckoutRequest(null, null).items()).isNull();
        var items = new ArrayList<CheckoutItemRequest>();
        items.add(null);

        assertThat(new CheckoutRequest(items, null).items()).containsExactly((CheckoutItemRequest) null);
    }

    @Test
    void responseItemsCannotBeChangedThroughEitherReference() {
        var item = new OrderItemResponse(1L, "Product", 1, BigDecimal.ONE);
        var items = new ArrayList<OrderItemResponse>();
        items.add(item);
        var response = new OrderResponse(1L, "order", null, null, "owner", "CREATED",
                BigDecimal.ONE, null, items, null);

        items.clear();

        assertThat(response.items()).containsExactly(item);
        assertThatThrownBy(() -> response.items().clear()).isInstanceOf(UnsupportedOperationException.class);
    }
}
