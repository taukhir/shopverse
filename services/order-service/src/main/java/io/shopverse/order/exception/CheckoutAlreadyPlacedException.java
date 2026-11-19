package io.shopverse.order.exception;

public class CheckoutAlreadyPlacedException extends RuntimeException {

    public CheckoutAlreadyPlacedException(String message) {
        super(message);
    }
}
