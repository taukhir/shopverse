package io.shopverse.gateway.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.stream.Collectors;

@Component
public class BrowserCookieTokenRelayFilter implements GlobalFilter, Ordered {

    private final String accessCookieName;

    public BrowserCookieTokenRelayFilter(
            @Value("${security.browser.access-cookie-name:SHOPVERSE_ACCESS}") String accessCookieName
    ) {
        this.accessCookieName = accessCookieName;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        var accessCookie = exchange.getRequest().getCookies().getFirst(accessCookieName);
        if (accessCookie == null || accessCookie.getValue().isBlank()) return chain.filter(exchange);

        String forwardedCookies = exchange.getRequest().getCookies().values().stream()
                .flatMap(java.util.Collection::stream)
                .filter(cookie -> !accessCookieName.equals(cookie.getName()))
                .map(cookie -> cookie.getName() + "=" + cookie.getValue())
                .collect(Collectors.joining("; "));
        var request = exchange.getRequest().mutate().headers(headers -> {
            headers.setBearerAuth(accessCookie.getValue());
            if (forwardedCookies.isBlank()) headers.remove(HttpHeaders.COOKIE);
            else headers.set(HttpHeaders.COOKIE, forwardedCookies);
        }).build();
        return chain.filter(exchange.mutate().request(request).build());
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }
}
