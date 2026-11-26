package io.shopverse.gateway.security;

import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpCookie;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.core.publisher.Mono;

import static org.assertj.core.api.Assertions.assertThat;

class BrowserCookieTokenRelayFilterTest {

    @Test
    void relaysCookieJwtAsAuthorizationAndDoesNotForwardAccessCookie() {
        var exchange = MockServerWebExchange.from(MockServerHttpRequest.get("/api/v1/accounts/current")
                .cookie(new HttpCookie("SHOPVERSE_ACCESS", "synthetic-jwt"))
                .cookie(new HttpCookie("XSRF-TOKEN", "synthetic-csrf"))
                .header("Authorization", "Bearer stale-header-token"));
        BrowserCookieTokenRelayFilter filter = new BrowserCookieTokenRelayFilter("SHOPVERSE_ACCESS");
        String[] authorization = new String[1];
        String[] cookies = new String[1];
        GatewayFilterChain chain = routedExchange -> {
            authorization[0] = routedExchange.getRequest().getHeaders().getFirst("Authorization");
            cookies[0] = routedExchange.getRequest().getHeaders().getFirst("Cookie");
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();

        assertThat(authorization[0]).isEqualTo("Bearer synthetic-jwt");
        assertThat(cookies[0]).contains("XSRF-TOKEN=synthetic-csrf").doesNotContain("SHOPVERSE_ACCESS");
    }
}
