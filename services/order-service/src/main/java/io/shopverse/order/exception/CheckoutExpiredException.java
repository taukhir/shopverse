package io.shopverse.order.exception;

public class CheckoutExpiredException extends RuntimeException {

    public CheckoutExpiredException(String message) {
        super(message);
    }
}
