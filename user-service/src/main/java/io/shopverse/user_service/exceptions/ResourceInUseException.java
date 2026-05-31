package io.shopverse.user_service.exceptions;

public final class ResourceInUseException extends ApiException {
    public ResourceInUseException(String message) {
        super(message);
    }
}
