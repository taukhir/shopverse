package io.shopverse.platform.security;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RedisAccessTokenRevocationStoreTest {

    private final StringRedisTemplate redisTemplate = mock(StringRedisTemplate.class);
    private final ValueOperations<String, String> valueOperations = mock(ValueOperations.class);
    private final RedisAccessTokenRevocationStore store =
            new RedisAccessTokenRevocationStore(redisTemplate, "shopverse:auth:revoked-jti:v1:");

    @Test
    void storesOnlyRevocationMarkerWithExpiryBoundedByJwtExpiry() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        Instant expiresAt = Instant.now().plusSeconds(90);
        ArgumentCaptor<Duration> ttlCaptor = ArgumentCaptor.forClass(Duration.class);

        store.revoke("id-123", expiresAt);

        verify(valueOperations).set(
                eq("shopverse:auth:revoked-jti:v1:id-123"),
                eq("1"),
                ttlCaptor.capture()
        );
        assertThat(ttlCaptor.getValue())
                .isGreaterThan(Duration.ZERO)
                .isLessThanOrEqualTo(Duration.ofSeconds(90));
    }

    @Test
    void doesNotStoreAlreadyExpiredToken() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        store.revoke("id-123", Instant.now().minusSeconds(1));

        org.mockito.Mockito.verifyNoInteractions(valueOperations);
    }

    @Test
    void rejectsInvalidTokenIdsBeforeBuildingRedisKey() {
        assertThatThrownBy(() -> store.isRevoked("id:with:delimiters"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void reportsRevokedWhenMarkerExists() {
        when(redisTemplate.hasKey(anyString())).thenReturn(true);

        assertThat(store.isRevoked("id-123")).isTrue();
    }
}
