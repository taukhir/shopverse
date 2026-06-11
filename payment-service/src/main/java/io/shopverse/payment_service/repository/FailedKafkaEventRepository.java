package io.shopverse.payment_service.repository;

import io.shopverse.payment_service.entity.FailedKafkaEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FailedKafkaEventRepository extends JpaRepository<FailedKafkaEvent, Long> {

    List<FailedKafkaEvent> findAllByOrderByFailedAtDesc();
}
