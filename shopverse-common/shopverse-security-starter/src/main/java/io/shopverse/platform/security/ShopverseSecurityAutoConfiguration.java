package io.shopverse.platform.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;

@AutoConfiguration
@ConditionalOnClass({JwtDecoder.class, JwtAuthenticationConverter.class, StringRedisTemplate.class})
public class ShopverseSecurityAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean(AccessTokenRevocationStore.class)
    AccessTokenRevocationStore accessTokenRevocationStore(
            StringRedisTemplate redisTemplate,
            @Value("${security.jwt.revocation-key-prefix:shopverse:auth:revoked-jti:v1:}") String keyPrefix
    ) {
        return new RedisAccessTokenRevocationStore(redisTemplate, keyPrefix);
    }

    @Bean
    @ConditionalOnMissingBean(AccessTokenRevocationValidator.class)
    AccessTokenRevocationValidator accessTokenRevocationValidator(AccessTokenRevocationStore store) {
        return new AccessTokenRevocationValidator(store);
    }

    @Bean
    @ConditionalOnMissingBean
    JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter jwtConverter = new JwtAuthenticationConverter();
        jwtConverter.setJwtGrantedAuthoritiesConverter(new ShopverseJwtAuthoritiesConverter());
        return jwtConverter;
    }

    @Bean
    @ConditionalOnMissingBean
    JwtDecoder jwtDecoder(
            @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri}") String jwkSetUri,
            @Value("${security.jwt.issuer}") String issuer,
            AccessTokenRevocationValidator revocationValidator
    ) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
        OAuth2TokenValidator<Jwt> validator = new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(issuer),
                revocationValidator
        );
        decoder.setJwtValidator(validator);
        return decoder;
    }
}
