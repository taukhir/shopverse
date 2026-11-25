package io.shopverse.auth.dto;

import java.time.Instant;
import java.util.List;

public record BrowserSessionResponse(boolean authenticated, String username, List<String> roles, Instant expiresAt) {
}
