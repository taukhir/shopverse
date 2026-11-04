package io.shopverse.user_service.exceptions;

public final class DuplicateResourceException extends ApiException {
    public DuplicateResourceException(String message) {
        super(message);
    }
}
