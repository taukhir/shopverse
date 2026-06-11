package io.shopverse.payment_service.security;

import io.shopverse.payment_service.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component("paymentAuthorization")
@RequiredArgsConstructor
public class PaymentAuthorization {

    private final PaymentRepository paymentRepository;

    @Transactional(readOnly = true)
    public boolean isOwner(String orderNumber, String username) {
        return username != null
                && paymentRepository.existsByOrderNumberAndCustomerUsername(orderNumber, username);
    }
}
