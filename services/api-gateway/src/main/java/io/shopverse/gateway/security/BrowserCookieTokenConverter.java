package io.shopverse.gateway.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.server.resource.authentication.BearerTokenAuthenticationToken;
import org.springframework.security.oauth2.server.resource.web.server.authentication.ServerBearerTokenAuthenticationConverter;
import org.springframework.security.web.server.authentication.ServerAuthenticationConverter;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class BrowserCookieTokenConverter implements ServerAuthenticationConverter {

    private final String accessCookieName;
    private final ServerBearerTokenAuthenticationConverter headerConverter = new ServerBearerTokenAuthenticationConverter();

    public BrowserCookieTokenConverter(
            @Value("${security.browser.access-cookie-name:SHOPVERSE_ACCESS}") String accessCookieName
    ) {
        this.accessCookieName = accessCookieName;
    }

    @Override
    public Mono<Authentication> convert(ServerWebExchange exchange) {
        HttpCookie cookie = exchange.getRequest().getCookies().getFirst(accessCookieName);
        if (cookie != null && !cookie.getValue().isBlank()) {
            return Mono.just(new BearerTokenAuthenticationToken(cookie.getValue()));
        }
        return headerConverter.convert(exchange);
    }
}
