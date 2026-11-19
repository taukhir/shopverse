package io.shopverse.order.exception;

public class CheckoutVersionMismatchException extends RuntimeException {

    public CheckoutVersionMismatchException(String message) {
        super(message);
    }
}
