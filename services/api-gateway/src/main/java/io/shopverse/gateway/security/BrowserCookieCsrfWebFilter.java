package io.shopverse.gateway.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class BrowserCookieCsrfWebFilter implements WebFilter {

    private final String accessCookieName;
    private final String csrfCookieName;
    private final String csrfHeaderName;
    private final Set<String> allowedOrigins;
    private final Set<String> browserMutationPaths;

    public BrowserCookieCsrfWebFilter(
            @Value("${security.browser.access-cookie-name:SHOPVERSE_ACCESS}") String accessCookieName,
            @Value("${security.browser.csrf-cookie-name:XSRF-TOKEN}") String csrfCookieName,
            @Value("${security.browser.csrf-header-name:X-XSRF-TOKEN}") String csrfHeaderName,
            @Value("${security.browser.csrf.protected-paths:/auth/login,/auth/logout,/auth/revoke}") String browserMutationPaths,
            @Value("${security.browser.csrf.allowed-origins:http://localhost:4200,http://127.0.0.1:4200}") String allowedOrigins
    ) {
        this.accessCookieName = accessCookieName;
        this.csrfCookieName = csrfCookieName;
        this.csrfHeaderName = csrfHeaderName;
        this.browserMutationPaths = Arrays.stream(browserMutationPaths.split(","))
                .map(String::trim)
                .filter(path -> !path.isEmpty())
                .collect(Collectors.toUnmodifiableSet());
        this.allowedOrigins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .map(BrowserCookieCsrfWebFilter::normalizeOrigin)
                .collect(Collectors.toUnmodifiableSet());
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        HttpMethod method = exchange.getRequest().getMethod();
        if (method == null || isSafeMethod(method)) return chain.filter(exchange);

        String path = exchange.getRequest().getPath().value();
        boolean browserMutationPath = browserMutationPaths.contains(path);
        boolean browserCookieRequest = exchange.getRequest().getCookies().containsKey(accessCookieName);
        boolean browserSessionMutation = exchange.getRequest().getCookies().containsKey(csrfCookieName);
        if (!browserMutationPath && !browserCookieRequest && !browserSessionMutation) return chain.filter(exchange);

        if (!validOrigin(exchange) || !validCsrfToken(exchange)) {
            exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
            return exchange.getResponse().setComplete();
        }
        return chain.filter(exchange);
    }

    private boolean validCsrfToken(ServerWebExchange exchange) {
        var cookie = exchange.getRequest().getCookies().getFirst(csrfCookieName);
        String header = exchange.getRequest().getHeaders().getFirst(csrfHeaderName);
        if (cookie == null || header == null || cookie.getValue().isBlank()) return false;
        return MessageDigest.isEqual(
                cookie.getValue().getBytes(StandardCharsets.UTF_8),
                header.getBytes(StandardCharsets.UTF_8)
        );
    }

    private boolean validOrigin(ServerWebExchange exchange) {
        String origin = exchange.getRequest().getHeaders().getOrigin();
        if (origin == null || origin.isBlank()) {
            String referer = exchange.getRequest().getHeaders().getFirst("Referer");
            if (referer == null || referer.isBlank()) return false;
            try {
                URI uri = URI.create(referer);
                origin = uri.getScheme() + "://" + uri.getAuthority();
            } catch (IllegalArgumentException exception) {
                return false;
            }
        }
        return allowedOrigins.contains(normalizeOrigin(origin));
    }

    private boolean isSafeMethod(HttpMethod method) {
        return HttpMethod.GET.equals(method)
                || HttpMethod.HEAD.equals(method)
                || HttpMethod.OPTIONS.equals(method)
                || HttpMethod.TRACE.equals(method);
    }

    private static String normalizeOrigin(String origin) {
        return origin.trim().replaceAll("/$", "").toLowerCase(java.util.Locale.ROOT);
    }
}
