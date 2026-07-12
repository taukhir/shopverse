package io.shopverse.payment_service.security;

import io.shopverse.payment_service.constants.PaymentConstants;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationConverter jwtAuthenticationConverter
    ) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                PaymentConstants.PUBLIC_API + "/**",
                                PaymentConstants.API_ROOT + "/webhooks/**",
                                "/swagger-ui/**",
                                "/v3/api-docs/**"
                        ).permitAll()
                        .requestMatchers(
                                "/actuator/health",
                                "/actuator/health/**",
                                "/actuator/info",
                                "/actuator/prometheus"
                        ).permitAll()
                        .requestMatchers(PaymentConstants.API_ROOT + "/admin/**").hasRole("ADMIN")
                        .requestMatchers(PaymentConstants.API_ROOT + "/admin").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, PaymentConstants.API_ROOT + "/**").hasAnyRole("CUSTOMER", "ADMIN")
                        .requestMatchers(HttpMethod.POST, PaymentConstants.API_ROOT + "/**").hasAnyRole("CUSTOMER", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, PaymentConstants.API_ROOT + "/**").hasAnyRole("CUSTOMER", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE, PaymentConstants.API_ROOT + "/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth -> oauth
                        .bearerTokenResolver(publicEndpointBearerTokenResolver())
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter))
                );

        return http.build();
    }

    @Bean
    public BearerTokenResolver publicEndpointBearerTokenResolver() {
        DefaultBearerTokenResolver delegate = new DefaultBearerTokenResolver();

        return request -> {
            String path = request.getRequestURI();
            if (path.startsWith(PaymentConstants.PUBLIC_API + "/")
                    || path.startsWith(PaymentConstants.API_ROOT + "/webhooks/")
                    || isPublicActuatorEndpoint(path)) {
                return null;
            }
            return delegate.resolve(request);
        };
    }

    private boolean isPublicActuatorEndpoint(String path) {
        return path.startsWith("/actuator/health")
                || path.equals("/actuator/info")
                || path.equals("/actuator/prometheus");
    }

}
