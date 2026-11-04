package io.shopverse.user_service.exceptions;

public final class BadRequestException extends ApiException {
    public BadRequestException(String message) {
        super(message);
    }
}
