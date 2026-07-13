package io.shopverse.labs;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import io.shopverse.labs.order.OrderApplicationService;
import io.shopverse.labs.order.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class TransactionBoundaryTest {
    @Autowired OrderApplicationService service;
    @Autowired OrderRepository orders;

    @BeforeEach
    void clean() {
        orders.deleteAll();
    }

    @Test
    void uncheckedFailureRollsBackTheOrderAggregate() {
        assertThatThrownBy(() -> service.placeOrderThenFail("customer-7"))
                .isInstanceOf(IllegalStateException.class);

        assertThat(orders.count()).isZero();
    }
}
