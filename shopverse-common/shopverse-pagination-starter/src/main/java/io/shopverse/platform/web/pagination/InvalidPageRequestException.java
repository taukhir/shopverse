package io.shopverse.platform.web.pagination;

public class InvalidPageRequestException extends RuntimeException {
    public InvalidPageRequestException(String message) {
        super(message);
    }
}
