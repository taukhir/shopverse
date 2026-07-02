package io.shopverse.platform.kafka.recovery;

import java.util.List;
import java.util.Optional;

public interface FailedKafkaEventStore {

    boolean existsUnreplayed(String sourceTopic, String payload);

    void saveFailed(String sourceTopic, String payload, String reason, int retryCount);

    List<FailedKafkaEventRecord> findAll();

    Optional<FailedKafkaEventRecord> findById(Long id);

    FailedKafkaEventRecord markReplayed(Long id, String replayedBy);
}
