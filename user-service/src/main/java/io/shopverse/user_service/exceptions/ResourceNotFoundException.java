package io.shopverse.user_service.exceptions;

public final class ResourceNotFoundException extends ApiException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
