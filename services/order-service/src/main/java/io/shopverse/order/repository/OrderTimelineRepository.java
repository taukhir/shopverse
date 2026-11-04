package io.shopverse.order.repository;

import io.shopverse.order.entity.OrderTimelineEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderTimelineRepository extends JpaRepository<OrderTimelineEvent, Long> {

    List<OrderTimelineEvent> findAllByOrderNumberOrderByOccurredAtAsc(String orderNumber);
}
