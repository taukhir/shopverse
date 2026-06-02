package io.shopverse.payment_service.security;

import io.shopverse.payment_service.constants.PaymentConstants;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/**", PaymentConstants.PUBLIC_API + "/**").permitAll()
                        .requestMatchers(HttpMethod.GET, PaymentConstants.API_ROOT + "/**").hasAnyRole("USER", "ADMIN")
                        .requestMatchers(HttpMethod.POST, PaymentConstants.API_ROOT + "/**").hasAnyRole("USER", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, PaymentConstants.API_ROOT + "/**").hasAnyRole("USER", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE, PaymentConstants.API_ROOT + "/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth -> oauth
                        .bearerTokenResolver(publicEndpointBearerTokenResolver())
                        .jwt(Customizer.withDefaults())
                );

        return http.build();
    }

    @Bean
    public BearerTokenResolver publicEndpointBearerTokenResolver() {
        DefaultBearerTokenResolver delegate = new DefaultBearerTokenResolver();

        return request -> {
            String path = request.getRequestURI();
            if (path.startsWith(PaymentConstants.PUBLIC_API + "/") || path.startsWith("/actuator/")) {
                return null;
            }
            return delegate.resolve(request);
        };
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter converter = new JwtGrantedAuthoritiesConverter();
        converter.setAuthoritiesClaimName("roles");
        converter.setAuthorityPrefix("");

        JwtAuthenticationConverter jwtConverter = new JwtAuthenticationConverter();
        jwtConverter.setJwtGrantedAuthoritiesConverter(converter);

        return jwtConverter;
    }
}
