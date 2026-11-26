package io.shopverse.order.repository;

import io.shopverse.order.entity.OrderEntity;
import io.shopverse.order.entity.OrderStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    @Query("""
            select o from OrderEntity o
            where (:search = '' or lower(o.orderNumber) like lower(concat('%', :search, '%'))
                or lower(o.customerUsername) like lower(concat('%', :search, '%')))
              and (:status is null or o.status = :status)
            """)
    Page<OrderEntity> findAdminOrders(
            @Param("search") String search,
            @Param("status") OrderStatus status,
            Pageable pageable
    );

    boolean existsByIdAndCustomerUsername(Long id, String customerUsername);
}
