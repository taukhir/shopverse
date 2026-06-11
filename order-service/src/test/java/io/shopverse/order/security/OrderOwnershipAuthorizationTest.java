package io.shopverse.order.security;

import io.shopverse.order.controller.OrderController;
import io.shopverse.order.entity.OrderEntity;
import io.shopverse.order.repository.OrderRepository;
import io.shopverse.order.service.CatalogService;
import io.shopverse.order.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest(properties = {
        "eureka.client.enabled=false",
        "spring.cloud.config.enabled=false",
        "management.tracing.enabled=false",
        "spring.datasource.url=jdbc:h2:mem:order-ownership;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=none",
        "spring.liquibase.change-log=classpath:db/changelog/db.changelog-master.yml",
        "spring.kafka.listener.auto-startup=false",
        "spring.task.scheduling.enabled=false",
        "shopverse.kafka.topics.order-created=shopverse.order.created",
        "shopverse.kafka.topics.inventory-reserved=shopverse.inventory.reserved",
        "shopverse.kafka.topics.inventory-failed=shopverse.inventory.failed",
        "shopverse.kafka.topics.payment-completed=shopverse.payment.completed",
        "shopverse.kafka.topics.payment-failed=shopverse.payment.failed"
})
class OrderOwnershipAuthorizationTest {

    @Autowired private OrderController controller;
    @Autowired private OrderRepository repository;
    @MockitoBean private OrderService orderService;
    @MockitoBean private CatalogService catalogService;
    @MockitoBean private JwtDecoder jwtDecoder;

    private Long orderId;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
        orderId = repository.save(new OrderEntity(
                "ORD-OWNER-1", "alice", "correlation-owner-1", "idempotency-owner-1"
        )).getId();
    }

    @Test
    @WithMockUser(username = "alice", roles = "CUSTOMER")
    void ownerCanReadTimeline() {
        assertThatNoException().isThrownBy(() -> controller.getTimeline(orderId));
    }

    @Test
    @WithMockUser(username = "bob", roles = "CUSTOMER")
    void anotherCustomerCannotReadTimeline() {
        assertThatThrownBy(() -> controller.getTimeline(orderId))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void administratorCanReadAnyTimeline() {
        assertThatNoException().isThrownBy(() -> controller.getTimeline(orderId));
    }
}
