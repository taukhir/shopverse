package io.shopverse.order.recovery;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FailedKafkaEventRepository extends JpaRepository<FailedKafkaEvent, Long> {
    List<FailedKafkaEvent> findAllByOrderByFailedAtDesc();

    boolean existsBySourceTopicAndPayloadAndReplayedFalse(String sourceTopic, String payload);
}
