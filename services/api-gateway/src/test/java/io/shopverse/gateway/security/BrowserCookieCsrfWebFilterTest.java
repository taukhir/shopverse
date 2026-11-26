package io.shopverse.gateway.security;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpCookie;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.concurrent.atomic.AtomicBoolean;

import static org.assertj.core.api.Assertions.assertThat;

class BrowserCookieCsrfWebFilterTest {

    private final BrowserCookieCsrfWebFilter filter = new BrowserCookieCsrfWebFilter(
            "SHOPVERSE_ACCESS", "XSRF-TOKEN", "X-XSRF-TOKEN", "/auth/login,/auth/logout", "http://localhost:4200"
    );

    @Test
    void rejectsCookieAuthenticatedMutationWithoutMatchingCsrfToken() {
        var exchange = MockServerWebExchange.from(MockServerHttpRequest.post("/api/v1/accounts/current")
                .cookie(new HttpCookie("SHOPVERSE_ACCESS", "synthetic-token"))
                .header("Origin", "http://localhost:4200"));
        AtomicBoolean continued = new AtomicBoolean();

        filter.filter(exchange, ignored -> {
            continued.set(true);
            return Mono.empty();
        }).block();

        assertThat(exchange.getResponse().getStatusCode().value()).isEqualTo(403);
        assertThat(continued).isFalse();
    }

    @Test
    void acceptsCookieAuthenticatedMutationOnlyWithMatchingTokenAndTrustedOrigin() {
        var exchange = MockServerWebExchange.from(MockServerHttpRequest.post("/api/v1/accounts/current")
                .cookie(new HttpCookie("SHOPVERSE_ACCESS", "synthetic-token"))
                .cookie(new HttpCookie("XSRF-TOKEN", "synthetic-csrf"))
                .header("X-XSRF-TOKEN", "synthetic-csrf")
                .header("Origin", "http://localhost:4200"));
        AtomicBoolean continued = new AtomicBoolean();

        filter.filter(exchange, ignored -> {
            continued.set(true);
            return Mono.empty();
        }).block();

        assertThat(continued).isTrue();
    }

    @Test
    void rejectsCsrfCookieMutationEvenWithoutAccessCookieOrConfiguredAuthPath() {
        var exchange = MockServerWebExchange.from(MockServerHttpRequest.post("/api/v1/public/users/register")
                .cookie(new HttpCookie("XSRF-TOKEN", "synthetic-csrf"))
                .header("Origin", "http://localhost:4200"));
        AtomicBoolean continued = new AtomicBoolean();

        filter.filter(exchange, ignored -> {
            continued.set(true);
            return Mono.empty();
        }).block();

        assertThat(exchange.getResponse().getStatusCode().value()).isEqualTo(403);
        assertThat(continued).isFalse();
    }

    @Test
    void rejectsLoginCsrfFromAnUntrustedOriginEvenWhenTokensMatch() {
        var exchange = MockServerWebExchange.from(MockServerHttpRequest.post("/auth/login")
                .cookie(new HttpCookie("XSRF-TOKEN", "synthetic-csrf"))
                .header("X-XSRF-TOKEN", "synthetic-csrf")
                .header("Origin", "https://attacker.example"));
        AtomicBoolean continued = new AtomicBoolean();

        filter.filter(exchange, ignored -> {
            continued.set(true);
            return Mono.empty();
        }).block();

        assertThat(exchange.getResponse().getStatusCode().value()).isEqualTo(403);
        assertThat(continued).isFalse();
    }

    @Test
    void rejectsLoginWhenCsrfCookieIsMissing() {
        var exchange = MockServerWebExchange.from(MockServerHttpRequest.post("/auth/login")
                .header("Origin", "http://localhost:4200"));
        AtomicBoolean continued = new AtomicBoolean();

        filter.filter(exchange, ignored -> {
            continued.set(true);
            return Mono.empty();
        }).block();

        assertThat(exchange.getResponse().getStatusCode().value()).isEqualTo(403);
        assertThat(continued).isFalse();
    }
}
