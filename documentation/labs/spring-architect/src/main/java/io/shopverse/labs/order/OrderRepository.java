package io.shopverse.labs.order;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface OrderRepository extends JpaRepository<OrderEntity, UUID> {
    @EntityGraph(attributePaths = "lines")
    @Query("select distinct o from OrderEntity o")
    List<OrderEntity> findAllWithLines();
}
