package io.shopverse.platform.security;

import edu.umd.cs.findbugs.annotations.SuppressFBWarnings;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.time.Duration;
import java.time.Instant;

public class RedisAccessTokenRevocationStore implements AccessTokenRevocationStore {

    private static final String REVOCATION_VALUE = "1";
    private static final int MAX_TOKEN_ID_LENGTH = 128;
    private static final String TOKEN_ID_PATTERN = "[A-Za-z0-9._-]+";

    private final StringRedisTemplate redisTemplate;
    private final String keyPrefix;

    // Spring owns this shared infrastructure bean; it must be retained, not copied.
    @SuppressFBWarnings(
            value = "EI_EXPOSE_REP2",
            justification = "Retains the injected Spring Redis infrastructure bean by design."
    )
    public RedisAccessTokenRevocationStore(StringRedisTemplate redisTemplate, String keyPrefix) {
        this.redisTemplate = redisTemplate;
        this.keyPrefix = keyPrefix;
    }

    @Override
    public void revoke(String tokenId, Instant expiresAt) {
        validateTokenId(tokenId);
        if (expiresAt == null) {
            throw new IllegalArgumentException("Token expiry is required");
        }

        Duration ttl = Duration.between(Instant.now(), expiresAt);
        if (!ttl.isNegative() && !ttl.isZero()) {
            redisTemplate.opsForValue().set(key(tokenId), REVOCATION_VALUE, ttl);
        }
    }

    @Override
    public boolean isRevoked(String tokenId) {
        validateTokenId(tokenId);
        return Boolean.TRUE.equals(redisTemplate.hasKey(key(tokenId)));
    }

    private String key(String tokenId) {
        return keyPrefix + tokenId;
    }

    private void validateTokenId(String tokenId) {
        if (tokenId == null || tokenId.length() > MAX_TOKEN_ID_LENGTH || !tokenId.matches(TOKEN_ID_PATTERN)) {
            throw new IllegalArgumentException("Invalid access-token identifier");
        }
    }
}
