package io.shopverse.payment_service.provider;

import java.math.BigDecimal;

public interface PaymentProvider {

    /**
     * Authorizes a payment without exposing provider-specific DTOs to the SAGA.
     */
    PaymentProviderResult authorize(String orderNumber, BigDecimal amount);
}
