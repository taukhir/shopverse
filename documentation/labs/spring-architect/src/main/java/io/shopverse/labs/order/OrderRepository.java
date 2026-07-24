package io.shopverse.labs.order;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;

public interface OrderRepository extends JpaRepository<OrderEntity, UUID>, OrderSearchOperations {
    @EntityGraph(attributePaths = "lines")
    @Query("select distinct o from OrderEntity o")
    List<OrderEntity> findAllWithLines();

    List<OrderEntity> findByCustomerIdAndStatusOrderByTotalDesc(
            String customerId, String status);

    Slice<OrderEntity> findSliceByStatusOrderById(String status, Pageable pageable);

    Page<OrderEntity> findPageByStatusOrderById(String status, Pageable pageable);

    @Query("""
            select o.id as id, o.status as status, o.total as total
            from OrderEntity o
            where o.status = :status
            order by o.total desc
            """)
    List<OrderSummary> findSummariesByStatus(String status);

    @Modifying(flushAutomatically = true)
    @Query("""
            update OrderEntity o
            set o.status = :next
            where o.status = :current
            """)
    int bulkTransition(String current, String next);

    interface OrderSummary {
        UUID getId();
        String getStatus();
        BigDecimal getTotal();
    }
}
