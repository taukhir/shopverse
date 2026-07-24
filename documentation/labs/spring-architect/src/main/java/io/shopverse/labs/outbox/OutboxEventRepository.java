package io.shopverse.labs.outbox;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface OutboxEventRepository extends JpaRepository<OutboxEventEntity, UUID> {
    List<OutboxEventEntity> findByStatusOrderByCreatedAtAsc(
            OutboxStatus status, Pageable pageable);

    Optional<OutboxEventEntity> findByIdAndClaimToken(UUID id, UUID claimToken);

    long countByStatus(OutboxStatus status);

    Optional<OutboxEventEntity> findFirstByStatusOrderByCreatedAtAsc(OutboxStatus status);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            update OutboxEventEntity e
            set e.status = io.shopverse.labs.outbox.OutboxStatus.IN_FLIGHT,
                e.claimToken = :claimToken,
                e.claimedAt = :claimedAt,
                e.attempts = e.attempts + 1
            where e.id = :id
              and e.status = io.shopverse.labs.outbox.OutboxStatus.PENDING
            """)
    int claim(UUID id, UUID claimToken, Instant claimedAt);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            update OutboxEventEntity e
            set e.status = io.shopverse.labs.outbox.OutboxStatus.PUBLISHED,
                e.publishedAt = :publishedAt,
                e.claimToken = null,
                e.claimedAt = null
            where e.id = :id
              and e.claimToken = :claimToken
              and e.status = io.shopverse.labs.outbox.OutboxStatus.IN_FLIGHT
            """)
    int markPublished(UUID id, UUID claimToken, Instant publishedAt);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            update OutboxEventEntity e
            set e.status = io.shopverse.labs.outbox.OutboxStatus.PENDING,
                e.claimToken = null,
                e.claimedAt = null
            where e.status = io.shopverse.labs.outbox.OutboxStatus.IN_FLIGHT
              and e.claimedAt < :expiredBefore
            """)
    int releaseExpiredClaims(Instant expiredBefore);
}
