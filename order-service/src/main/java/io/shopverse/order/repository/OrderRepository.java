package io.shopverse.order.repository;

import io.shopverse.order.entity.OrderEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<OrderEntity, Long> {

    @EntityGraph(attributePaths = "items")
    Optional<OrderEntity> findWithItemsById(Long id);

    @EntityGraph(attributePaths = "items")
    Optional<OrderEntity> findWithItemsByOrderNumber(String orderNumber);

    @EntityGraph(attributePaths = "items")
    Optional<OrderEntity> findWithItemsByIdempotencyKey(String idempotencyKey);

    @EntityGraph(attributePaths = "items")
    List<OrderEntity> findAllByCustomerUsernameOrderByCreatedAtDesc(String customerUsername);

    @EntityGraph(attributePaths = "items")
    List<OrderEntity> findAllByOrderByCreatedAtDesc();

    boolean existsByIdAndCustomerUsername(Long id, String customerUsername);
}
