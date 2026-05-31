package io.shopverse.order.security;

import io.shopverse.order.model.Permissions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http

                /*
                 * Disable CSRF for stateless REST APIs
                 */
                .csrf(AbstractHttpConfigurer::disable)

                /*
                 * Stateless session management
                 */
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                /*
                 * Authorization Rules
                 */
                .authorizeHttpRequests(auth -> auth

                        /*
                         * Public APIs
                         */
                        .requestMatchers(
                                "/api/v1/orders/public/**"
                        ).permitAll()

                        /*
                         * Admin APIs
                         * IMPORTANT:
                         * Keep admin matchers BEFORE generic matchers
                         */
                        .requestMatchers(
                                "/api/v1/orders/admin/**"
                        ).hasRole("ADMIN")

                        /*
                         * Read APIs
                         */
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/v1/orders/**"
                        ).hasAnyRole("USER", "ADMIN")

                        /*
                         * Write APIs
                         */
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/v1/orders/**"
                        ).hasAnyRole("USER", "ADMIN")

                        /*
                         * Update APIs
                         */
                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/v1/orders/**"
                        ).hasAnyRole("USER", "ADMIN")

                        /*
                         * Patch APIs
                         */
                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/v1/orders/**"
                        ).hasAnyRole("USER", "ADMIN")

                        /*
                         * Delete APIs
                         */
                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/v1/orders/**"
                        ).hasRole( "ADMIN")

                        /*
                         * Any other request
                         */
                        .anyRequest()
                        .authenticated()
                )

                // JWT Resource Server
                .oauth2ResourceServer(oauth ->
                        oauth.jwt(Customizer.withDefaults())
                );

        return http.build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {

        JwtGrantedAuthoritiesConverter converter =
                new JwtGrantedAuthoritiesConverter();

        converter.setAuthoritiesClaimName("roles");

        converter.setAuthorityPrefix("");

        JwtAuthenticationConverter jwtConverter =
                new JwtAuthenticationConverter();

        jwtConverter.setJwtGrantedAuthoritiesConverter(converter);

        return jwtConverter;
    }


    @Bean
    public PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

}