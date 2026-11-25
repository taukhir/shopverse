package io.shopverse.auth.service;

import io.shopverse.platform.security.AccessTokenRevocationStore;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AccessTokenRevocationService {

    private final AccessTokenRevocationStore revocationStore;

    public void revoke(Jwt jwt) {
        revocationStore.revoke(jwt.getId(), jwt.getExpiresAt());
    }
}
