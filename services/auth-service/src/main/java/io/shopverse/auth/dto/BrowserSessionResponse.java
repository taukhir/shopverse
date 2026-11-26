package io.shopverse.auth.dto;

import java.time.Instant;
import java.util.List;
import java.util.Objects;

public record BrowserSessionResponse(boolean authenticated, String username, List<String> roles, Instant expiresAt) {

    public BrowserSessionResponse {
        roles = List.copyOf(Objects.requireNonNull(roles, "roles"));
    }
}
