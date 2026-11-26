package io.shopverse.gateway.config;

import io.shopverse.gateway.security.RevocationAwareReactiveJwtDecoder;
import io.shopverse.gateway.security.BrowserCookieCsrfWebFilter;
import io.shopverse.gateway.security.BrowserCookieTokenConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    ReactiveJwtDecoder jwtDecoder(
            @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri}") String jwkSetUri,
            @Value("${security.jwt.issuer}") String issuer,
            ReactiveStringRedisTemplate redisTemplate,
            @Value("${security.jwt.revocation-key-prefix:shopverse:auth:revoked-jti:v1:}") String keyPrefix
    ) {
        NimbusReactiveJwtDecoder decoder = NimbusReactiveJwtDecoder.withJwkSetUri(jwkSetUri).build();
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<Jwt>(
                JwtValidators.createDefaultWithIssuer(issuer)
        ));
        return new RevocationAwareReactiveJwtDecoder(decoder, redisTemplate, keyPrefix);
    }

    @Bean
    SecurityWebFilterChain securityWebFilterChain(
            ServerHttpSecurity http,
            BrowserCookieTokenConverter tokenConverter,
            BrowserCookieCsrfWebFilter csrfWebFilter
    ) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .addFilterAt(csrfWebFilter, org.springframework.security.config.web.server.SecurityWebFiltersOrder.CSRF)
                .authorizeExchange(authorize -> authorize
                        .pathMatchers(
                                "/auth/login",
                                "/auth/csrf",
                                "/auth/session",
                                "/auth/.well-known/jwks.json",
                                "/api/v1/public/**",
                                "/api/v1/inventory/public/**",
                                "/actuator/health",
                                "/actuator/health/**",
                                "/actuator/info",
                                "/actuator/prometheus",
                                "/actuator/shopverse-readiness"
                        ).permitAll()
                        .anyExchange().authenticated()
                )
                .oauth2ResourceServer(oauth -> oauth
                        .bearerTokenConverter(tokenConverter)
                        .jwt(Customizer.withDefaults()))
                .build();
    }
}
