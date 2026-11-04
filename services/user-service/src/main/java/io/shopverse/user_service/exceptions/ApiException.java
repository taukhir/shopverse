package io.shopverse.user_service.exceptions;

public sealed abstract class ApiException extends RuntimeException permits
        BadRequestException,
        DuplicateResourceException,
        ResourceInUseException,
        ResourceNotFoundException {

    protected ApiException(String message) {
        super(message);
    }
}
