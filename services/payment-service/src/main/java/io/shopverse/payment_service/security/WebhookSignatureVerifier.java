package io.shopverse.payment_service.security;

import io.shopverse.payment_service.config.PaymentProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@Component
@RequiredArgsConstructor
public class WebhookSignatureVerifier {

    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final PaymentProperties paymentProperties;

    public boolean isValid(byte[] body, String providedSignatureHex) {
        if (providedSignatureHex == null || providedSignatureHex.isBlank()) {
            return false;
        }
        byte[] expected = computeSignature(body);
        byte[] provided;
        try {
            provided = HexFormat.of().parseHex(providedSignatureHex.trim());
        } catch (IllegalArgumentException malformedHex) {
            return false;
        }
        return MessageDigest.isEqual(expected, provided);
    }

    private byte[] computeSignature(byte[] body) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(
                    paymentProperties.webhookSecret().getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
            return mac.doFinal(body);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("Unable to compute webhook signature", e);
        }
    }
}
