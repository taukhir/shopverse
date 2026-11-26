package io.shopverse.payment_service.security;

import io.shopverse.payment_service.controller.PaymentController;
import io.shopverse.payment_service.dto.PaymentIntentRequest;
import io.shopverse.payment_service.dto.PaymentResponse;
import io.shopverse.payment_service.entity.PaymentEntity;
import io.shopverse.payment_service.repository.PaymentRepository;
import io.shopverse.payment_service.service.FailedKafkaEventService;
import io.shopverse.payment_service.service.PaymentService;
import io.shopverse.payment_service.provider.StubPaymentProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.math.BigDecimal;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@SpringBootTest(properties = {
        "spring.cloud.config.enabled=false",
        "eureka.client.enabled=false",
        "spring.datasource.url=jdbc:h2:mem:payment-ownership;MODE=MySQL;DB_CLOSE_DELAY=-1",
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
        "shopverse.kafka.topics.payment-failed=shopverse.payment.failed",
        "security.jwt.issuer=shopverse-auth-service",
        "shopverse.payment.webhook-secret=test-webhook-secret"
})
class PaymentOwnershipAuthorizationTest {

    @Autowired private PaymentController controller;
    @Autowired private PaymentRepository repository;
    @MockitoBean private PaymentService paymentService;
    @MockitoBean private FailedKafkaEventService failedKafkaEventService;
    @MockitoBean private StubPaymentProvider stubPaymentProvider;
    @MockitoBean private JwtDecoder jwtDecoder;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
        repository.save(new PaymentEntity(
                "ORD-PAYMENT-1", "correlation-payment-1", "alice", new BigDecimal("49.99")
        ));
    }

    @Test
    @WithMockUser(username = "alice", roles = "CUSTOMER")
    void ownerCanReadPayment() {
        assertThatNoException().isThrownBy(() -> controller.getByOrderNumber("ORD-PAYMENT-1"));
    }

    @Test
    @WithMockUser(username = "bob", roles = "CUSTOMER")
    void anotherCustomerCannotReadPayment() {
        assertThatThrownBy(() -> controller.getByOrderNumber("ORD-PAYMENT-1"))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void administratorCanReadAnyPayment() {
        assertThatNoException().isThrownBy(() -> controller.getByOrderNumber("ORD-PAYMENT-1"));
    }

    @Test
    @WithMockUser(username = "bob", roles = "CUSTOMER")
    void customerCannotCreateAPaymentIntentForAnyOrderNumber() {
        var request = new PaymentIntentRequest("ORD-PAYMENT-1", "correlation-payment-1", new BigDecimal("49.99"));

        assertThatThrownBy(() -> controller.createIntent(request, null))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void administratorCanCreateAPaymentIntent() {
        var request = new PaymentIntentRequest("ORD-PAYMENT-1", "correlation-payment-1", new BigDecimal("49.99"));
        when(paymentService.createIntent(anyString(), anyString(), anyString(), any()))
                .thenReturn(new PaymentResponse(
                        1L, "ORD-PAYMENT-1", "correlation-payment-1", new BigDecimal("49.99"),
                        "PENDING", null, null, Instant.now(), Instant.now()));

        var authentication = SecurityContextHolder.getContext().getAuthentication();

        assertThatNoException().isThrownBy(() -> controller.createIntent(request, authentication));
    }
}
