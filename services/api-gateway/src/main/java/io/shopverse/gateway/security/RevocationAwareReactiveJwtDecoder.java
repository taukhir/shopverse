package io.shopverse.gateway.security;

import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import reactor.core.publisher.Mono;

public class RevocationAwareReactiveJwtDecoder implements ReactiveJwtDecoder {

    // These collaborators are intentionally retained: the delegate performs JWT
    // validation and the Redis template checks revocation state.
    @SuppressWarnings("EI_EXPOSE_REP2")
    private final ReactiveJwtDecoder delegate;
    @SuppressWarnings("EI_EXPOSE_REP2")
    private final ReactiveStringRedisTemplate redisTemplate;
    private final String keyPrefix;

    public RevocationAwareReactiveJwtDecoder(
            ReactiveJwtDecoder delegate,
            ReactiveStringRedisTemplate redisTemplate,
            String keyPrefix
    ) {
        this.delegate = delegate;
        this.redisTemplate = redisTemplate;
        this.keyPrefix = keyPrefix;
    }

    @Override
    public Mono<Jwt> decode(String token) throws JwtException {
        return delegate.decode(token)
                .flatMap(jwt -> {
                    String tokenId = jwt.getId();
                    if (tokenId == null || tokenId.isBlank() || tokenId.length() > 128
                            || !tokenId.matches("[A-Za-z0-9._-]+")) {
                        return Mono.error(new JwtException("Access token is invalid"));
                    }
                    return redisTemplate.hasKey(keyPrefix + tokenId)
                            .flatMap(revoked -> revoked
                                    ? Mono.error(new JwtException("Access token is invalid"))
                                    : Mono.just(jwt));
                })
                .onErrorMap(error -> error instanceof JwtException
                        ? error
                        : new JwtException("Access token could not be validated", error));
    }
}
