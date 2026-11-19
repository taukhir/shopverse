package io.shopverse.order.repository;

import io.shopverse.order.entity.CheckoutEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CheckoutRepository extends JpaRepository<CheckoutEntity, Long> {

    @EntityGraph(attributePaths = "items")
    Optional<CheckoutEntity> findWithItemsByCheckoutNumberAndCustomerUsername(String checkoutNumber, String customerUsername);
}
