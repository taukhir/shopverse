package io.shopverse.payment_service.security;

import io.shopverse.payment_service.constants.PaymentConstants;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Verifies the provider webhook's HMAC signature before the request body
 * reaches the controller. The webhook endpoint is intentionally public
 * (the real provider carries no app JWT) - this is what replaces
 * authentication for that one path.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebhookSignatureFilter extends OncePerRequestFilter {

    public static final String SIGNATURE_HEADER = "X-Webhook-Signature";

    private final WebhookSignatureVerifier signatureVerifier;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !(PaymentConstants.API_ROOT + "/webhooks/provider").equals(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        byte[] body = request.getInputStream().readAllBytes();
        String signature = request.getHeader(SIGNATURE_HEADER);

        if (!signatureVerifier.isValid(body, signature)) {
            log.warn("Rejected payment webhook with missing or invalid signature from {}", request.getRemoteAddr());
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid webhook signature");
            return;
        }

        filterChain.doFilter(new CachedBodyHttpServletRequest(request, body), response);
    }
}
