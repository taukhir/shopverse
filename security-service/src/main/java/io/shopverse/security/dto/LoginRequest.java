package io.shopverse.security.dto;

public record LoginRequest(
        String username,
        String password) {
}
