package io.shopverse.labs;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import io.shopverse.labs.order.OrderRepository;
import io.shopverse.labs.outbox.ClaimedOutboxEvent;
import io.shopverse.labs.outbox.IdempotentOrderConsumer;
import io.shopverse.labs.outbox.OrderOutboxApplicationService;
import io.shopverse.labs.outbox.OrderProjectionRepository;
import io.shopverse.labs.outbox.OutboxClaimService;
import io.shopverse.labs.outbox.OutboxCompletionService;
import io.shopverse.labs.outbox.OutboxEventEntity;
import io.shopverse.labs.outbox.OutboxEventRepository;
import io.shopverse.labs.outbox.OutboxMessage;
import io.shopverse.labs.outbox.OutboxReconciliationService;
import io.shopverse.labs.outbox.OutboxRelay;
import io.shopverse.labs.outbox.OutboxStatus;
import io.shopverse.labs.outbox.ProcessedEventRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Executors;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class TransactionalOutboxTest {
    @Autowired OrderOutboxApplicationService applicationService;
    @Autowired OutboxEventRepository outbox;
    @Autowired OrderRepository orders;
    @Autowired OutboxClaimService claims;
    @Autowired OutboxCompletionService completion;
    @Autowired IdempotentOrderConsumer consumer;
    @Autowired ProcessedEventRepository inbox;
    @Autowired OrderProjectionRepository projections;
    @Autowired OutboxReconciliationService reconciliation;

    @BeforeEach
    void clean() {
        inbox.deleteAll();
        projections.deleteAll();
        outbox.deleteAll();
        orders.deleteAll();
    }

    @Test
    void orderAndOutboxCommitOrRollbackTogether() {
        UUID committedOrder = applicationService.createOrder("customer-1");
        assertThat(orders.existsById(committedOrder)).isTrue();
        assertThat(outbox.findAll())
                .singleElement()
                .satisfies(event -> {
                    assertThat(event.getAggregateId()).isEqualTo(committedOrder);
                    assertThat(event.getStatus()).isEqualTo(OutboxStatus.PENDING);
                });

        assertThatThrownBy(() -> applicationService.createOrderThenFail("customer-2"))
                .isInstanceOf(IllegalStateException.class);
        assertThat(orders.count()).isOne();
        assertThat(outbox.count()).isOne();
    }

    @Test
    void acknowledgementLossLeavesAClaimThatCanExpireAndPublishAgain() {
        applicationService.createOrder("customer-1");
        List<OutboxMessage> brokerLog = new ArrayList<>();
        var acknowledgementLost = new OutboxRelay(claims, completion, message -> {
            brokerLog.add(message);
            throw new IllegalStateException("broker stored record but acknowledgement was lost");
        });

        var firstAttempt = acknowledgementLost.publishAvailable(10, Instant.now());
        OutboxEventEntity claimed = outbox.findAll().getFirst();
        assertThat(firstAttempt.failed()).isOne();
        assertThat(claimed.getStatus()).isEqualTo(OutboxStatus.IN_FLIGHT);
        assertThat(claimed.getAttempts()).isOne();

        assertThat(claims.releaseExpiredClaims(Instant.now().plusSeconds(1))).isOne();
        var successfulRelay = new OutboxRelay(claims, completion, brokerLog::add);
        var secondAttempt = successfulRelay.publishAvailable(10, Instant.now());

        OutboxEventEntity published = outbox.findAll().getFirst();
        assertThat(secondAttempt.published()).isOne();
        assertThat(published.getStatus()).isEqualTo(OutboxStatus.PUBLISHED);
        assertThat(published.getAttempts()).isEqualTo(2);
        assertThat(brokerLog).hasSize(2);
        assertThat(brokerLog.get(0).eventId()).isEqualTo(brokerLog.get(1).eventId());
    }

    @Test
    void twoRelayInstancesCannotOwnTheSameClaim() throws Exception {
        for (int index = 0; index < 12; index++) {
            applicationService.createOrder("customer-" + index);
        }
        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(() -> claims.claimBatch(10, Instant.now()));
            var second = executor.submit(() -> claims.claimBatch(10, Instant.now()));
            List<ClaimedOutboxEvent> firstClaims = first.get();
            List<ClaimedOutboxEvent> secondClaims = second.get();
            List<ClaimedOutboxEvent> remainingClaims =
                    claims.claimBatch(10, Instant.now());

            var eventIds = new HashSet<UUID>();
            firstClaims.forEach(event -> assertThat(eventIds.add(
                    event.message().eventId())).isTrue());
            secondClaims.forEach(event -> assertThat(eventIds.add(
                    event.message().eventId())).isTrue());
            remainingClaims.forEach(event -> assertThat(eventIds.add(
                    event.message().eventId())).isTrue());
            assertThat(eventIds).hasSize(12);
        }
    }

    @Test
    void duplicateDeliveryChangesTheProjectionOnlyOnce() {
        OutboxMessage message = message(UUID.randomUUID(), UUID.randomUUID(), 1, "OrderCreated");

        assertThat(consumer.consume(message)).isTrue();
        assertThat(consumer.consume(message)).isFalse();

        assertThat(inbox.count()).isOne();
        assertThat(projections.count()).isOne();
        assertThat(projections.findById(message.aggregateId()).orElseThrow()
                .getAggregateVersion()).isOne();
    }

    @Test
    void concurrentDuplicateDeliveryHasOneTransactionalWinner() throws Exception {
        OutboxMessage message = message(UUID.randomUUID(), UUID.randomUUID(), 1, "OrderCreated");
        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(() -> consumer.consume(message));
            var second = executor.submit(() -> consumer.consume(message));
            assertThat(List.of(first.get(), second.get()))
                    .containsExactlyInAnyOrder(true, false);
        }
        assertThat(inbox.count()).isOne();
        assertThat(projections.count()).isOne();
    }

    @Test
    void olderAggregateVersionCannotOverwriteNewerProjection() {
        UUID orderId = UUID.randomUUID();
        OutboxMessage versionTwo = message(
                UUID.randomUUID(), orderId, 2, "OrderConfirmed");
        OutboxMessage delayedVersionOne = message(
                UUID.randomUUID(), orderId, 1, "OrderCreated");

        assertThat(consumer.consume(versionTwo)).isTrue();
        assertThat(consumer.consume(delayedVersionOne)).isTrue();

        var projection = projections.findById(orderId).orElseThrow();
        assertThat(projection.getAggregateVersion()).isEqualTo(2);
        assertThat(projection.getLastEventType()).isEqualTo("OrderConfirmed");
        assertThat(inbox.count()).isEqualTo(2);
    }

    @Test
    void reconciliationExposesBacklogAndOldestPendingAge() {
        Instant old = Instant.now().minusSeconds(120);
        outbox.save(new OutboxEventEntity(
                UUID.randomUUID(), UUID.randomUUID(), 1,
                "OrderCreated", "{}", old));

        var health = reconciliation.snapshot(Instant.now());
        assertThat(health.pending()).isOne();
        assertThat(health.inFlight()).isZero();
        assertThat(health.published()).isZero();
        assertThat(health.oldestPendingAge()).isGreaterThanOrEqualTo(
                java.time.Duration.ofSeconds(120));
    }

    private OutboxMessage message(
            UUID eventId, UUID orderId, long version, String eventType) {
        return new OutboxMessage(
                eventId, orderId, version, eventType,
                "{\"orderId\":\"" + orderId + "\"}", Instant.now());
    }
}
