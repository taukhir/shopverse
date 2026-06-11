package io.shopverse.payment_service.repository;

import io.shopverse.payment_service.entity.PaymentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<PaymentEntity, Long> {

    Optional<PaymentEntity> findByOrderNumber(String orderNumber);

    boolean existsByOrderNumberAndCustomerUsername(String orderNumber, String customerUsername);
}
