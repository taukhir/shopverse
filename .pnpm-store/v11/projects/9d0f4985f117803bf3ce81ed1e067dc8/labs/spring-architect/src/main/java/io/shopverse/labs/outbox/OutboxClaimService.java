package io.shopverse.labs.outbox;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OutboxClaimService {
    private final OutboxEventRepository outbox;

    public OutboxClaimService(OutboxEventRepository outbox) {
        this.outbox = outbox;
    }

    @Transactional
    public List<ClaimedOutboxEvent> claimBatch(int size, Instant now) {
        if (size < 1 || size > 100) {
            throw new IllegalArgumentException("claim size must be between 1 and 100");
        }
        var candidates = outbox.findByStatusOrderByCreatedAtAsc(
                OutboxStatus.PENDING, PageRequest.of(0, size));
        List<ClaimedOutboxEvent> claimed = new ArrayList<>();
        for (OutboxEventEntity candidate : candidates) {
            UUID token = UUID.randomUUID();
            if (outbox.claim(candidate.getId(), token, now) == 1) {
                OutboxEventEntity owned = outbox.findByIdAndClaimToken(
                        candidate.getId(), token).orElseThrow();
                claimed.add(new ClaimedOutboxEvent(OutboxMessage.from(owned), token));
            }
        }
        return claimed;
    }

    @Transactional
    public int releaseExpiredClaims(Instant expiredBefore) {
        return outbox.releaseExpiredClaims(expiredBefore);
    }
}
