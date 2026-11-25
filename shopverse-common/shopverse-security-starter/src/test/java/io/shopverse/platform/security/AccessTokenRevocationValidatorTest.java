package io.shopverse.platform.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AccessTokenRevocationValidatorTest {

    private final AccessTokenRevocationStore store = mock(AccessTokenRevocationStore.class);
    private final AccessTokenRevocationValidator validator = new AccessTokenRevocationValidator(store);

    @Test
    void acceptsTokenWhenItsIdIsNotRevoked() {
        when(store.isRevoked("token-123")).thenReturn(false);

        assertThat(validator.validate(jwt("token-123")).hasErrors()).isFalse();
    }

    @Test
    void rejectsRevokedToken() {
        when(store.isRevoked("token-123")).thenReturn(true);

        OAuth2TokenValidatorResult result = validator.validate(jwt("token-123"));

        assertThat(result.hasErrors()).isTrue();
    }

    @Test
    void failsClosedWhenRedisCheckThrows() {
        when(store.isRevoked("token-123")).thenThrow(new IllegalStateException("redis unavailable"));

        assertThat(validator.validate(jwt("token-123")).hasErrors()).isTrue();
    }

    private Jwt jwt(String tokenId) {
        return new Jwt(
                "synthetic-token",
                Instant.now(),
                Instant.now().plusSeconds(60),
                Map.of("alg", "RS256"),
                Map.of("jti", tokenId)
        );
    }
}
