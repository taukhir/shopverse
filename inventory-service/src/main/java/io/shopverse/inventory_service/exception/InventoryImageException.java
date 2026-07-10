package io.shopverse.inventory_service.exception;

public class InventoryImageException extends RuntimeException {
    public InventoryImageException(String message) {
        super(message);
    }

    public InventoryImageException(String message, Throwable cause) {
        super(message, cause);
    }
}
