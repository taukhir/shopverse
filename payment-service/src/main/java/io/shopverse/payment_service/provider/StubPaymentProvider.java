package io.shopverse.payment_service.provider;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.concurrent.atomic.AtomicReference;

@Component
public class StubPaymentProvider implements PaymentProvider {

    private final AtomicReference<PaymentSimulationMode> mode =
            new AtomicReference<>(PaymentSimulationMode.SUCCESS);

    @Override
    public PaymentProviderResult authorize(String orderNumber, BigDecimal amount) {
        return switch (mode.get()) {
            case SUCCESS -> new PaymentProviderResult(
                    PaymentSimulationMode.SUCCESS,
                    "STUB-PAY-" + orderNumber,
                    null
            );
            case DECLINE -> new PaymentProviderResult(
                    PaymentSimulationMode.DECLINE,
                    null,
                    "Stub payment provider declined the authorization"
            );
            case TIMEOUT -> new PaymentProviderResult(
                    PaymentSimulationMode.TIMEOUT,
                    null,
                    "Stub payment provider timed out; final outcome is uncertain"
            );
        };
    }

    public PaymentSimulationMode mode() {
        return mode.get();
    }

    public void setMode(PaymentSimulationMode mode) {
        this.mode.set(mode);
    }
}
