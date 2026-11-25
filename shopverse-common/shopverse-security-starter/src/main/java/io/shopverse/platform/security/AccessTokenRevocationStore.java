package io.shopverse.platform.security;

import java.time.Instant;

/** Stores access-token revocation markers without persisting bearer tokens. */
public interface AccessTokenRevocationStore {

    void revoke(String tokenId, Instant expiresAt);

    boolean isRevoked(String tokenId);
}
