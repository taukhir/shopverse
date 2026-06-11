package io.shopverse.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    /*
     * SecurityWebFilterChain is the WebFlux equivalent of SecurityFilterChain.
     *
     * In WebFlux, requests pass through a reactive security filter chain.
     * This bean defines:
     * 1. Which APIs are public
     * 2. Which APIs require authentication
     * 3. How JWT authentication should happen
     */
    @Bean
    SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {

        return http

                /*
                 * Disable CSRF protection.
                 *
                 * CSRF is mainly required for browser-based session authentication.
                 * For REST APIs using JWT Bearer tokens, CSRF is usually disabled.
                 */
                .csrf(ServerHttpSecurity.CsrfSpec::disable)

                /*
                 * Configure authorization rules for incoming HTTP requests.
                 */
                .authorizeExchange(authorize -> authorize

                        /*
                         * These endpoints are public.
                         * No JWT token is required for these paths.
                         */
                        .pathMatchers(
                                "/auth/**",      // Login/register/auth APIs
                                "/api/v1/*/public/**",      // Public APIs of different services
                                "/actuator/health",         // Health check endpoint
                                "/actuator/health/**",      // Health details/liveness/readiness
                                "/actuator/info",           // App info endpoint
                                "/actuator/prometheus"      // Metrics endpoint for Prometheus
                        ).permitAll()

                        /*
                         * All other APIs require authentication.
                         * User must send a valid JWT token.
                         */
                        .anyExchange().authenticated()
                )

                /*
                 * Enable OAuth2 Resource Server support with JWT.
                 *
                 * This means the service expects:
                 *
                 * Authorization: Bearer <jwt-token>
                 *
                 * Spring Security will:
                 * 1. Extract the token
                 * 2. Decode the JWT
                 * 3. Validate signature/expiry/issuer/audience if configured
                 * 4. Create Authentication object
                 * 5. Store it in ReactiveSecurityContextHolder
                 *
                 * .oauth2ResourceServer(oauth -> oauth.jwt(Customizer.withDefaults()))
                 * measn " Enable JWT support using Spring Boot’s default auto-configuration.”
                 * Spring will look for properties like
                 * spring:
                 *      security:
                 *          oauth2:
                 *              resourceserver:
                 *                  jwt:
                 *                      jwk-set-uri: http://localhost:8081/.well-known/jwks.json
                 */
                .oauth2ResourceServer(oauth -> oauth.jwt(Customizer.withDefaults()))

                /*
                 * Build the final reactive security filter chain.
                 */
                .build();
    }
}