package io.shopverse.payment_service.security;

import io.shopverse.payment_service.dto.PaymentResponse;
import io.shopverse.payment_service.service.FailedKafkaEventService;
import io.shopverse.payment_service.service.PaymentService;
import io.shopverse.payment_service.provider.StubPaymentProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.cloud.config.enabled=false",
        "eureka.client.enabled=false",
        "spring.datasource.url=jdbc:h2:mem:webhook-signature;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=none",
        "spring.liquibase.change-log=classpath:db/changelog/db.changelog-master.yml",
        "spring.kafka.listener.auto-startup=false",
        "shopverse.kafka.topics.order-created=shopverse.order.created",
        "shopverse.kafka.topics.inventory-reserved=shopverse.inventory.reserved",
        "shopverse.kafka.topics.inventory-failed=shopverse.inventory.failed",
        "shopverse.kafka.topics.payment-completed=shopverse.payment.completed",
        "shopverse.kafka.topics.payment-failed=shopverse.payment.failed",
        "security.jwt.issuer=shopverse-auth-service",
        "shopverse.payment.webhook-secret=test-webhook-secret"
})
class WebhookSignatureFilterTest {

    private static final String PAYLOAD = """
            {"orderNumber":"ORD-WEBHOOK-1","status":"CAPTURED","paymentReference":"REF-1"}""";

    @Autowired private WebApplicationContext context;
    @MockitoBean private PaymentService paymentService;
    @MockitoBean private FailedKafkaEventService failedKafkaEventService;
    @MockitoBean private StubPaymentProvider stubPaymentProvider;
    @MockitoBean private JwtDecoder jwtDecoder;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void requestWithNoSignatureHeaderIsRejected() throws Exception {
        mockMvc.perform(post("/api/v1/payments/webhooks/provider")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PAYLOAD))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void requestWithAWrongSignatureIsRejected() throws Exception {
        mockMvc.perform(post("/api/v1/payments/webhooks/provider")
                        .header(WebhookSignatureFilter.SIGNATURE_HEADER, sign(PAYLOAD, "wrong-secret"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PAYLOAD))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void requestWithAValidSignatureReachesTheController() throws Exception {
        when(paymentService.applyWebhook(any())).thenReturn(new PaymentResponse(
                1L, "ORD-WEBHOOK-1", "corr-1", new BigDecimal("10.00"),
                "CAPTURED", "REF-1", null, Instant.now(), Instant.now()));

        mockMvc.perform(post("/api/v1/payments/webhooks/provider")
                        .header(WebhookSignatureFilter.SIGNATURE_HEADER, sign(PAYLOAD, "test-webhook-secret"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PAYLOAD))
                .andExpect(status().isOk());
    }

    @Test
    void aSignatureComputedOverADifferentBodyThanTheOneSentIsRejected() throws Exception {
        String tamperedPayload = """
                {"orderNumber":"ORD-WEBHOOK-1","status":"REFUNDED"}""";

        mockMvc.perform(post("/api/v1/payments/webhooks/provider")
                        .header(WebhookSignatureFilter.SIGNATURE_HEADER, sign(PAYLOAD, "test-webhook-secret"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(tamperedPayload))
                .andExpect(status().isUnauthorized());
    }

    private String sign(String body, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(body.getBytes(StandardCharsets.UTF_8)));
    }
}
