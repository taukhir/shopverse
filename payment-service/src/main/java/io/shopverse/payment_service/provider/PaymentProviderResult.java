package io.shopverse.payment_service.provider;

public record PaymentProviderResult(
        PaymentSimulationMode outcome,
        String reference,
        String reason
) {
}
