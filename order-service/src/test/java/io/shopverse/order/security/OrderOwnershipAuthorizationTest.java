package io.shopverse.order.security;

import io.shopverse.order.controller.OrderController;
import io.shopverse.order.repository.OrderRepository;
import io.shopverse.order.service.CatalogService;
import io.shopverse.order.service.OrderService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

@SpringJUnitConfig(OrderOwnershipAuthorizationTest.TestConfig.class)
class OrderOwnershipAuthorizationTest {

    private static final Long ORDER_ID = 1L;

    @Autowired
    private OrderController controller;

    @MockitoBean
    private OrderRepository repository;

    @MockitoBean
    private OrderService orderService;

    @MockitoBean
    private CatalogService catalogService;

    @Test
    @WithMockUser(username = "alice", roles = "CUSTOMER")
    void ownerCanReadTimeline() {
        given(repository.existsByIdAndCustomerUsername(ORDER_ID, "alice")).willReturn(true);

        assertThatNoException().isThrownBy(() -> controller.getTimeline(ORDER_ID));
    }

    @Test
    @WithMockUser(username = "bob", roles = "CUSTOMER")
    void anotherCustomerCannotReadTimeline() {
        given(repository.existsByIdAndCustomerUsername(ORDER_ID, "bob")).willReturn(false);

        assertThatThrownBy(() -> controller.getTimeline(ORDER_ID))
                .isInstanceOf(AuthorizationDeniedException.class);
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void administratorCanReadAnyTimeline() {
        assertThatNoException().isThrownBy(() -> controller.getTimeline(ORDER_ID));
    }

    @Configuration
    @EnableMethodSecurity
    @Import({OrderController.class, OrderAuthorization.class})
    static class TestConfig {
    }
}
