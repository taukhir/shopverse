package io.shopverse.order.security;

import io.shopverse.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component("orderAuthorization")
@RequiredArgsConstructor
public class OrderAuthorization {

    private final OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public boolean isOwner(Long orderId, String username) {
        return username != null
                && orderRepository.existsByIdAndCustomerUsername(orderId, username);
    }
}
