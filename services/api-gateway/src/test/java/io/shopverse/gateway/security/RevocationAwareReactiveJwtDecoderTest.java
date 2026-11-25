package io.shopverse.gateway.security;

import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Instant;
import java.util.Map;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RevocationAwareReactiveJwtDecoderTest {

    private final ReactiveJwtDecoder delegate = mock(ReactiveJwtDecoder.class);
    private final ReactiveStringRedisTemplate redisTemplate = mock(ReactiveStringRedisTemplate.class);
    private final RevocationAwareReactiveJwtDecoder decoder =
            new RevocationAwareReactiveJwtDecoder(delegate, redisTemplate, "revoked:");

    @Test
    void emitsJwtWhenRevocationMarkerDoesNotExist() {
        Jwt jwt = jwt("id-1");
        when(delegate.decode("signed-token")).thenReturn(Mono.just(jwt));
        when(redisTemplate.hasKey("revoked:id-1")).thenReturn(Mono.just(false));

        StepVerifier.create(decoder.decode("signed-token"))
                .expectNext(jwt)
                .verifyComplete();
    }

    @Test
    void rejectsJwtWhenRevocationMarkerExists() {
        when(delegate.decode("signed-token")).thenReturn(Mono.just(jwt("id-1")));
        when(redisTemplate.hasKey("revoked:id-1")).thenReturn(Mono.just(true));

        StepVerifier.create(decoder.decode("signed-token"))
                .expectError(JwtException.class)
                .verify();
    }

    @Test
    void failsClosedWhenRedisIsUnavailable() {
        when(delegate.decode("signed-token")).thenReturn(Mono.just(jwt("id-1")));
        when(redisTemplate.hasKey("revoked:id-1")).thenReturn(Mono.error(new IllegalStateException("offline")));

        StepVerifier.create(decoder.decode("signed-token"))
                .expectError(JwtException.class)
                .verify();
    }

    private Jwt jwt(String id) {
        Instant now = Instant.now();
        return new Jwt(
                "signed-token",
                now,
                now.plusSeconds(60),
                Map.of("alg", "RS256"),
                Map.of("jti", id)
        );
    }
}
