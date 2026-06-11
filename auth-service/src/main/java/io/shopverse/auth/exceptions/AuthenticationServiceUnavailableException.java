package io.shopverse.auth.exceptions;

public class AuthenticationServiceUnavailableException extends RuntimeException {

    public AuthenticationServiceUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
