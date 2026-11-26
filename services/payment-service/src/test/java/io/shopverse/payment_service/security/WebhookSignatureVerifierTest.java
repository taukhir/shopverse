package io.shopverse.payment_service.security;

import io.shopverse.payment_service.config.PaymentProperties;
import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

import static org.assertj.core.api.Assertions.assertThat;

class WebhookSignatureVerifierTest {

    private final PaymentProperties properties = new PaymentProperties(BigDecimal.TEN, "test-secret");
    private final WebhookSignatureVerifier verifier = new WebhookSignatureVerifier(properties);

    @Test
    void validSignatureForTheExactBodyIsAccepted() throws Exception {
        byte[] body = "{\"orderNumber\":\"ORD-1\",\"status\":\"CAPTURED\"}".getBytes(StandardCharsets.UTF_8);
        String signature = sign(body, "test-secret");

        assertThat(verifier.isValid(body, signature)).isTrue();
    }

    @Test
    void signatureComputedWithAWrongSecretIsRejected() throws Exception {
        byte[] body = "{\"orderNumber\":\"ORD-1\",\"status\":\"CAPTURED\"}".getBytes(StandardCharsets.UTF_8);
        String signature = sign(body, "attacker-guessed-secret");

        assertThat(verifier.isValid(body, signature)).isFalse();
    }

    @Test
    void signatureForADifferentBodyIsRejected() throws Exception {
        byte[] originalBody = "{\"orderNumber\":\"ORD-1\",\"status\":\"CAPTURED\"}".getBytes(StandardCharsets.UTF_8);
        byte[] tamperedBody = "{\"orderNumber\":\"ORD-1\",\"status\":\"REFUNDED\"}".getBytes(StandardCharsets.UTF_8);
        String signature = sign(originalBody, "test-secret");

        assertThat(verifier.isValid(tamperedBody, signature)).isFalse();
    }

    @Test
    void missingSignatureIsRejected() {
        byte[] body = "{}".getBytes(StandardCharsets.UTF_8);

        assertThat(verifier.isValid(body, null)).isFalse();
        assertThat(verifier.isValid(body, "")).isFalse();
        assertThat(verifier.isValid(body, "   ")).isFalse();
    }

    @Test
    void malformedHexSignatureIsRejectedNotThrown() {
        byte[] body = "{}".getBytes(StandardCharsets.UTF_8);

        assertThat(verifier.isValid(body, "not-valid-hex-zz")).isFalse();
    }

    private String sign(byte[] body, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(body));
    }
}
