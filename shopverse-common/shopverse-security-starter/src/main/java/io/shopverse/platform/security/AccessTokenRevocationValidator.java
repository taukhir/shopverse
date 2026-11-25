package io.shopverse.platform.security;

import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;

public class AccessTokenRevocationValidator implements OAuth2TokenValidator<Jwt> {

    private static final OAuth2Error REVOKED_TOKEN = new OAuth2Error(
            "invalid_token",
            "The access token is invalid or revoked",
            null
    );
    private static final OAuth2Error REVOCATION_CHECK_UNAVAILABLE = new OAuth2Error(
            "invalid_token",
            "The access token could not be validated",
            null
    );

    private final AccessTokenRevocationStore revocationStore;

    public AccessTokenRevocationValidator(AccessTokenRevocationStore revocationStore) {
        this.revocationStore = revocationStore;
    }

    @Override
    public OAuth2TokenValidatorResult validate(Jwt jwt) {
        try {
            String tokenId = jwt.getId();
            if (tokenId == null || tokenId.isBlank() || revocationStore.isRevoked(tokenId)) {
                return OAuth2TokenValidatorResult.failure(REVOKED_TOKEN);
            }
            return OAuth2TokenValidatorResult.success();
        } catch (RuntimeException exception) {
            return OAuth2TokenValidatorResult.failure(REVOCATION_CHECK_UNAVAILABLE);
        }
    }
}
