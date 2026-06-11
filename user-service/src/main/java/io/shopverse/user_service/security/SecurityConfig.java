package io.shopverse.user_service.security;

import io.shopverse.user_service.constants.ApiConstants;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.web.SecurityFilterChain;

import java.util.Arrays;
import java.util.LinkedHashSet;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri}")
    private String jwkSetUri;

    @Value("${security.jwt.issuer}")
    private String issuer;

    @Bean
    @Order(1)
    public SecurityFilterChain internalUserSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                // Keep HTTP Basic scoped to internal credential validation only.
                .securityMatcher(ApiConstants.INTERNAL_USERS + "/**")
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
                .httpBasic(Customizer.withDefaults());

        return http.build();
    }

    @Bean
    @Order(2)
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationConverter jwtAuthenticationConverter
    ) throws Exception {

        http

                .csrf(AbstractHttpConfigurer::disable)

                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/actuator/health",
                                "/actuator/health/**",
                                "/actuator/info",
                                "/actuator/prometheus"
                        ).permitAll()
                        .requestMatchers(ApiConstants.PUBLIC_API + "/**",

                                ApiConstants.SWAGGER, ApiConstants.SWAGGER_HTML, ApiConstants.OPEN_API).permitAll()
                        .requestMatchers(ApiConstants.USERS + "/**").hasAnyRole("CUSTOMER", "ADMIN")
                        .requestMatchers(ApiConstants.ROLES + "/**").hasRole("ADMIN")
                        .anyRequest().authenticated())

                .oauth2ResourceServer(oauth -> oauth.jwt(jwt ->
                        jwt.jwtAuthenticationConverter(jwtAuthenticationConverter)));

        return http.build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {

        JwtAuthenticationConverter jwtConverter = new JwtAuthenticationConverter();

        jwtConverter.setJwtGrantedAuthoritiesConverter(jwt -> {
            LinkedHashSet<GrantedAuthority> authorities = new LinkedHashSet<>();
            String roles = jwt.getClaimAsString("roles");
            if (roles != null) {
                Arrays.stream(roles.split(" "))
                        .filter(role -> !role.isBlank())
                        .map(SimpleGrantedAuthority::new)
                        .forEach(authorities::add);
            }
            var permissions = jwt.getClaimAsStringList("permissions");
            if (permissions != null) {
                permissions.stream()
                        .map(SimpleGrantedAuthority::new)
                        .forEach(authorities::add);
            }
            return authorities;
        });

        return jwtConverter;
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        NimbusJwtDecoder jwtDecoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
        OAuth2TokenValidator<Jwt> validator = new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(issuer)
        );

        jwtDecoder.setJwtValidator(validator);
        return jwtDecoder;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }
}
