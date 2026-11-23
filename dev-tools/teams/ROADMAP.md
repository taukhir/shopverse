# ShopVerse Engineering & Learning Roadmap

Companion to [`BACKLOG.md`](BACKLOG.md) — that file tracks *what* and *why*
for every item below (requirement, priority, source). This file tracks
*how*: concrete steps and the expected result for each item, organized into
tracks in the sequence recommended on 2026-11-17. Per the user's own
decision that session, items are picked up one at a time, not in a fixed
order — use this as the plan for whichever item is picked up next, not as
a schedule.

Each item cites its `BACKLOG.md` ID. Update status here as work lands;
don't duplicate the requirement/rationale text that already lives in
`BACKLOG.md` — link to it instead.

---

## Suggested Execution Order

A single, literal one-at-a-time queue, built from the track structure
below plus the team's existing priority decision (`OPEN-QUESTIONS.md` #8:
`BUG-013 → BUG-001 → dedup/inbox → FEAT-J → ENH-012`). Each row names why
it sits where it does — mostly a real dependency, sometimes just "no
dependency, good a this point for momentum." Sizes are rough:
**S** = a day or less, **M** = a few days, **L** = a week+, **XL** =
multi-week/needs its own planning pass.

| # | Item | Size | Why here |
|---|---|---|---|
| 1 | **BUG-013** fix | M | Hard blocker — nothing past checkout works until this lands. Already fully designed. |
| 1.5 | **BUG-034/035/036/037/038/039**, **ENH-033/034** — concurrency/ordering sweep fixes | L | Promoted here 2026-11-17: `BUG-035` (inventory `release()` can silently un-confirm a paid reservation and double-credit stock) and `BUG-036` (a stuck `PENDING` payment with no error, chainable from `BUG-020`) are rated **Critical** — real silent data corruption, not theoretical. Do this cluster together with/right after `BUG-013` since all of it touches the same saga code `BUG-013`'s fix already requires re-reading. |
| 2 | **FEAT-R** load testing (k6) | S | No dependency, but do it right after BUG-013 so the baseline measures a checkout that actually completes, not one stuck at `ORDER_CREATED`. |
| 3 | **BUG-001** option (a) implementation | L | Team's agreed #2 priority (`DECISIONS.md`); ADR 005 already designed it. No hard dependency on #1/#2 above, but sequenced here per that decision. |
| 4 | **FEAT-T** Kafka transactional inbox | M | Independent of BUG-001/013, but touches the same saga listeners BUG-013 just changed — doing it right after avoids re-reading that code twice. |
| 5 | **ENH-019** JWT key rotation + audience validation | M | Already designed (ADR 003's gap). No dependency on anything above — good to interleave here since it's shovel-ready and needs a clear head, not a half-finished saga refactor. |
| 6 | **ENH-015** DB performance tuning | S | Depends on #2 (needs a load-test baseline to tune against). |
| 7 | **ENH-001** Redis distributed cache | M | Benefits from #6 (don't cache a query you haven't tried to index first). |
| 8 | **FEAT-Q** Distributed rate limiting | S | Shares the Redis instance from #7 — do them back to back. |
| 9 | **ENH-014** Hibernate L2 cache | M | Same reasoning as #7 — tune the query first, cache second; also worth doing after #7 so the two caching layers' invalidation stories are written with each other in mind, not independently. |
| 10 | **FEAT-X** CDC exploration (Debezium) | M | No dependency — good breather item between the caching track and the next payment-priority item, and pairs conceptually with #4's inbox work while that's still fresh. |
| 11 | Team's dedup/inbox priority item | — | Already covered by #4 above — not a separate step. |
| 12 | **FEAT-J** Real payment provider adapter | L | Team's agreed #4 priority, after dedup/inbox (#4/#11). Biggest remaining gap between "demo" and "usable POC" per `PROGRESS.md`. |
| 13 | **FEAT-S** Back-office reconciliation console | M | Depends on #1 (BUG-013) and benefits from #12 (payment reconciliation is more real once FEAT-J exists) — but can start right after #1 if you'd rather build the UI shell before the payment adapter lands. |
| 14 | **FEAT-AA** Read-only MCP tool server | M | Independent — foundation for #15/#16 below. Good slot: core backlog items are past their riskiest point, the app has stable domain services to wrap as tools. |
| 15 | **FEAT-AB** AI chat/RAG/recommendation assistant | M | Depends on #14. |
| 16 | **FEAT-AC** AI Incident Investigator | M | Depends on #14. Best validated against #1 (BUG-013) — strongest demo is reproducing that exact symptom and comparing the tool's narrative to the real, already-documented root cause. |
| 17 | **ENH-016** Postgres advisory locks | S–M | Independent — needs your (a)/(b) decision (migrate a service, or compare against MySQL) when you get here, nothing blocks starting. |
| 18 | **ENH-017** Liquibase performance tuning | S | Independent, low effort — good filler item. |
| 19 | **ENH-018** Flyway comparison exercise | S | Independent, isolated by design — do whenever, no reason to delay. |
| 20 | **ENH-020** "Multiple databases" clarification + implementation | S–M | Needs your disambiguation first (read replica? polyglot for search?) — the clarifying conversation itself can happen any time before this slot. |
| 21 | **FEAT-Y** Migrate one service to Quarkus | L | Independent experiment — placed late deliberately so it doesn't compete for attention with the still-open BUG-001/FEAT-J work on the business-logic services. |
| 22 | **FEAT-Z** Reactive (WebFlux) read-path experiment | M | Same reasoning as #21 — a bounded experiment, not urgent, best done once the core backlog items aren't competing for the same mental bandwidth. |
| 23 | **FEAT-U** Kubernetes manifests/Helm chart | XL | Biggest remaining item — most valuable once the app itself is in a stable, feature-complete-enough state to deploy repeatedly. |
| 24 | **FEAT-V** Canary/rolling deployment | L | Hard dependency on #23. |
| 25 | **FEAT-W** AWS infra (EKS/ECR/EC2/S3) | XL | Hard dependency on #23; also gated on your explicit go-ahead on account/budget/teardown — do not start by default even when this slot is reached. |

**Not yet folded into this queue:** the 20 new findings from the
2026-11-17 codebase/security/architecture/database/performance audits
(`BUG-020` through `BUG-033`, `ENH-021` through `ENH-032`) — they're
fully written up in `BACKLOG.md` but haven't been slotted into this
ordered list yet. `BUG-027`/`BUG-028` (no login rate limit; bulkhead/DB-pool
mismatch) are almost certainly higher priority than most of this table —
flag if you want them actually sequenced in rather than just tracked.

This queue isn't a commitment to do all 25 — it's the order to pull from
when you say "next." Re-check this table if priorities shift (e.g. if
Codex weighs in on `OPEN-QUESTIONS.md` #8 and the team's priority order
changes) rather than trusting it blindly months from now.

---

## Track 0 — Unblock What's Already Designed

### BUG-013 — Fix the dead `PENDING_INVENTORY` transition

**Steps:**
1. Add `OrderEntity.markPendingInventory()` — sets `status =
   OrderStatus.PENDING_INVENTORY`, no other side effects.
2. Call it in `OrderServiceImpl.checkout()` immediately after the
   `ORDER_CREATED` timeline append, inside the same `@Transactional`
   method that enqueues the outbox event — not a separate transaction.
3. Write the proving test first (it should fail on current `HEAD`):
   assert `status == PENDING_INVENTORY` immediately after `checkout()`
   returns.
4. Run the existing saga tests; confirm `markInventoryReservedAndPaymentProcessing`
   and `markInventoryRejected` now actually fire instead of no-op'ing.
5. Add the idempotent-double-call case: deliver `InventoryReservedEvent`
   twice, assert the order only advances once.
6. Remove the dead code found alongside this bug in the same change:
   `OrderEntity.markReturned()`'s orphaned caller, and the unused
   standalone `markInventoryReserved(String)`/`markPaymentProcessing(String)`
   methods in `OrderServiceImpl`.
7. Run the full order-service test suite + integration tests
   (Testcontainers), then the full Gateway checkout smoke end to end.
8. Separately, draft the one-off data-remediation note for any real
   orders already stuck at `ORDER_CREATED` — do not run it anywhere
   beyond local without ops sign-off, per the existing BACKLOG note.

**Expected result:** a real checkout through the gateway reaches
`CONFIRMED` with all five timeline stages populated
(`ORDER_CREATED` → `PENDING_INVENTORY` → `INVENTORY_RESERVED` →
`PAYMENT_PROCESSING` → `CONFIRMED`). All 9 previously-dead `OrderStatus`
values become reachable. `reliability/problems/ORDER-STATUS-DEAD-TRANSITION-PROBLEM.md`
gets a final "fixed, commit `<sha>`" update.

---

## Track 1 — Kafka Hardening And CDC (FEAT-T, FEAT-X, BUG-034, ENH-033)

### BUG-034 — Lock/serialize the SAGA entities' state transitions

**Steps:**
1. Add `@Version` to `OrderEntity`, `InventoryReservation`, and
   `PaymentEntity` — the same pattern `InventoryItem` already has, just
   applied to the entities that actually drive the saga guards.
2. Write the proving test first (should fail today): deliver two different
   event types for the *same* order concurrently (e.g. a redelivered
   `InventoryReservedEvent` racing a legitimately-progressed
   `PaymentFailedEvent`, both targeting the same `OrderEntity` row) and
   assert one of them gets a stale-object exception rather than silently
   losing the other's update.
3. Decide the retry policy for the loser: re-read and re-apply if the
   event is still valid given the new state, or let it fall through to
   `@RetryableTopic`/DLT like the existing accidental-protection case in
   inventory-service does today — pick one deliberately, don't leave it
   as whatever `OptimisticLockException` happens to do by default.
4. Re-run the full saga integration test suite for all three services.

**Expected result:** the proving test from step 2 passes — two different
event types for the same order can no longer read-modify-write
concurrently without one of them detecting the conflict.

### BUG-035 — Fix `release()`'s unlocked read (the most severe finding of the sweep)

**Steps:**
1. Add `@Version` to `InventoryReservation` (it currently has none, unlike
   `InventoryItem`).
2. Change `release()` to use the same `findByOrderNumberForUpdate`
   pessimistic-write lock `confirmReservation()`/`expireReservations()`
   already use.
3. Write the proving test: start `confirmReservation()` for an order
   (lock held, about to commit `CONFIRMED`), concurrently call `release()`
   for the same order, and assert `release()` either blocks-then-no-ops
   (sees `CONFIRMED`, not `RESERVED`, after the lock releases) or raises a
   detectable conflict — never silently overwrites `CONFIRMED` back to
   `RELEASED`.
4. Add a regression test asserting `availableQuantity` is never
   double-credited in this scenario.

**Expected result:** the race described in `BUG-035` is no longer
reproducible — `release()` can never win against an already-committed
`CONFIRMED` reservation.

### BUG-036 — Make `process()` status-aware, not existence-aware

**Steps:**
1. Change `PaymentServiceImpl.process()`'s check from "does a row exist"
   to "does a row exist in a terminal/already-handled status
   (`CAPTURED`/`DECLINED`)."
2. For a row found in `PENDING` (or any non-terminal status) when the real
   `InventoryReservedEvent` arrives, resume real authorize/capture/decline
   processing instead of returning the stale row untouched.
3. Add an explicit error/metric for the case that should never normally
   happen (a `PENDING` row pre-existing before the saga's own event
   arrives) so this doesn't fail silently again even after the fix.
4. Write the proving test: pre-create a `PENDING` row for an order number
   (simulating `BUG-020`'s exploit path or any other pre-existing-row
   cause), then deliver the real `InventoryReservedEvent`, and assert the
   order reaches a real terminal outcome instead of staying stuck forever.

**Expected result:** no payment can get permanently stuck in `PENDING`
with no event and no error — either it resumes real processing or it
raises something visible.

### BUG-037 — Close the cancel-vs-confirm business-state divergence

**Steps:**
1. Inside the same lock `BUG-034` adds to `OrderEntity`, re-verify the
   cancellation guard immediately before `enqueueOrderCancelled` publishes
   — not just at the start of the method.
2. Add `OrderConfirmedEvent` to the outbox when `confirm()` succeeds, so a
   downstream consumer that already acted on a (losing) cancellation has
   something to reconcile against.
3. Write the proving test: race a customer cancel against `confirm()` for
   the same order and assert exactly one of {order is `CONFIRMED` with no
   `OrderCancelledEvent` published, order is `CANCELLED` with no
   `OrderConfirmedEvent` published} — never both events for one order.

**Expected result:** the specific business-state divergence `BUG-037`
describes (order record `CONFIRMED`, but inventory/payment already
compensated as if cancelled) can no longer happen.

### BUG-038 — Lock payment-service's REST-admin-vs-webhook path too

**Steps:**
1. Confirm `BUG-034`'s `@Version` addition to `PaymentEntity` also
   protects `reconcile()` and `applyWebhook()` — these are REST/webhook
   entry points, not `@KafkaListener` methods, so don't assume `BUG-034`'s
   fix automatically covers them without checking.
2. Write the proving test: race an admin `reconcile()` call against a
   simulated late `applyWebhook()` callback for the same `TIMED_OUT`
   payment and assert one loses with a detectable conflict, not a silent
   last-write-wins.

**Expected result:** the same protection `BUG-034` gives the Kafka-driven
transitions also covers the two non-Kafka entry points that mutate the
same entity.

### BUG-039 — Add a deterministic timeline ordering tiebreak

**Steps:**
1. Add `id` (or a dedicated sequence column) as a secondary sort key to
   `OrderTimelineRepository.findAllByOrderNumberOrderByOccurredAtAsc`.
2. Consider switching `occurredAt` to a DB-generated/transactional
   timestamp instead of application-side `Instant.now()`, if the ordering
   guarantee needs to survive clock-resolution ties, not just concurrent
   writes.
3. Write a test with two near-simultaneous timeline appends and assert
   the returned order is deterministic, not dependent on `Instant.now()`
   resolution.

**Expected result:** the customer-visible/audit timeline can no longer
show steps out of true commit order, independent of whether `BUG-034`'s
locking fix has landed yet.

### ENH-033 — Add explicit event versioning/sequencing

**Steps:**
1. Add a monotonic per-aggregate sequence number (or `occurredAt`
   timestamp with a documented tie-break rule) to each saga event record.
2. On the producing side, have each service's SAGA logic stamp the
   sequence from the aggregate's own transition count, not a shared
   counter.
3. On the consuming side, add an explicit check: reject (log + skip, same
   discipline as the existing state guards) an incoming event whose
   sequence is older than the aggregate's last-applied sequence —
   independent of whether the current-state guard would have caught it.
4. Write a test that proves this specifically: deliver an old event
   *after* a newer one has already been applied, where the current-state
   guard alone would NOT have caught it (construct a case where the state
   coincidentally still matches the stale event's precondition).

**Expected result:** "is this event older than one already applied" is
answered by an explicit, testable check — not an accidental side effect
of whatever state the aggregate happens to be in when the event arrives.

### FEAT-T — Transactional inbox + partitioning/consumer-group review

**Steps:**
1. Pick one listener to formalize first — `OrderSagaListener.onInventoryReserved`
   is the best candidate (it's the one already discussed in
   `OPEN-QUESTIONS.md` #8).
2. Add an `inbox_events` table (event ID, topic, consumer, processed-at)
   via a new Liquibase changelog in order-service.
3. Change the listener to: read event ID → check inbox → if present,
   skip; if absent, process + insert inbox row, same transaction as the
   state transition.
4. Write a duplicate-delivery test: publish the same event twice (same
   event ID), assert the business effect only happens once and the inbox
   has exactly one row.
5. Document the partition-key choice for each topic currently in use
   (`order-created`, `inventory-reserved`, `inventory-failed`,
   `payment-completed`, `payment-failed`) — confirm it's `orderNumber`
   everywhere, since per-aggregate ordering depends on that.
6. Review consumer concurrency (`spring.kafka.listener.concurrency` or
   equivalent) against partition count — more consumer threads than
   partitions is wasted, fewer serializes unnecessarily.
7. Add a load test (reuses FEAT-R's tooling once that exists) that proves
   ordering is preserved per order number under concurrent consumers.

**Expected result:** at least one listener has a real transactional
inbox with a passing duplicate-delivery test; every Kafka topic in use
has its partition-key rationale written down in
`reliability/SAGA-OUTBOX.md` or equivalent; a load test demonstrates
per-order ordering holds under concurrency.

### FEAT-X — CDC exploration (Debezium) vs. the existing outbox

**Steps:**
1. Stand up a Debezium connector (Kafka Connect + Debezium MySQL
   connector) against one service's database in a disposable Compose
   profile — inventory-service is a good candidate (simpler write
   pattern than order-service).
2. Point it at the binlog for one table (e.g. `inventory_reservations`)
   and confirm change events arrive on a Kafka topic.
3. Trigger the same business operation twice: once through the normal
   app flow (which emits an outbox event) and once by writing to the
   table directly, to compare what each mechanism captures.
4. Write up the comparison: what CDC gives you for free (no app code
   changes, captures *every* write including ones the app didn't
   intend to publish) versus what the outbox gives you (semantic,
   app-controlled event shape, no DB-replication dependency).
5. Decide and record whether ShopVerse should ever adopt CDC for
   anything, or whether this stays a comparison exercise — either answer
   is a legitimate outcome.

**Expected result:** a working Debezium pipeline on one table in a
disposable environment, a written comparison against the real outbox
implementation already in this repo, and an explicit recorded decision
(adopt / don't adopt) with reasoning — not just "CDC exists now."

---

## Track 2 — Data, Caching, And DB Performance

### FEAT-R — Load/performance testing (k6)

**Steps:**
1. Install k6 locally; write one scenario script against the two-step
   checkout flow (`POST /api/v1/checkouts`, then
   `POST /api/v1/checkouts/{checkoutId}/place-order`) with a ramping
   virtual-user profile. Keep each virtual user's checkout ID and
   idempotency key isolated.
2. Seed enough catalog data first (`Seed-ShopverseData.ps1`) so the test
   doesn't bottleneck on "not enough distinct products."
3. Run against the local Compose stack; capture p50/p95/p99 latency and
   error rate at 3 load levels (baseline, 2x, breaking point).
4. Identify the actual bottleneck at the breaking point (DB connection
   pool exhaustion? Kafka consumer lag? CPU on one service?) using the
   existing Prometheus/Grafana stack, not guesswork.
5. Check the result in to `documentation/` or a `load-tests/` folder as
   a repeatable script, not a one-off.

**Expected result:** a checked-in, re-runnable k6 script reporting real
p50/p95/p99 and throughput numbers for checkout, plus a written note on
what the actual bottleneck was at breaking point — this becomes the
baseline every later tuning item (ENH-015, ENH-001, ENH-014) measures
against.

### ENH-015 — DB performance tuning (indexing, query plans, pool sizing)

**Steps:**
1. With FEAT-R's load test running, capture the top 3 slowest queries
   per service via MySQL's slow-query log or `EXPLAIN` on suspect
   queries (order lookup by customer, inventory lookup by product ID,
   payment lookup by order number).
2. Run `EXPLAIN` on each; confirm whether it's using an index or doing a
   full scan.
3. Add missing indexes via a new Liquibase changelog (never edit an
   applied one) where a scan is found.
4. Re-run the load test; compare p95 before/after.
5. Review each service's HikariCP pool size against the load test's
   actual peak concurrent-connection count (`SHOW STATUS LIKE
   'Threads_connected'` during the test) — resize only if evidence
   shows contention, not by guessing a bigger number.

**Expected result:** a documented before/after comparison for at least
one real query (scan → index, with the p95 delta), and a HikariCP pool
size that's justified by a measured number instead of the framework
default.

### ENH-014 — Hibernate L2 cache

**Steps:**
1. Add a cache provider (Ehcache is the standard Spring Boot pairing)
   as a dependency on inventory-service only, as the pilot.
2. Enable `hibernate.cache.use_second_level_cache` and annotate the
   read-heavy, rarely-written entity (catalog item) with `@Cache`.
3. Decide and implement the invalidation story explicitly: on an admin
   catalog write, evict that entity's L2 entry — do not rely on a TTL
   alone if correctness matters (stale stock numbers are a real customer
   problem, this repo already treats that seriously per ENH-004).
4. Write a test: read an entity (cache miss, populates L2), read again
   (cache hit — assert via Hibernate statistics), write it, read again
   (assert the L2 entry was invalidated, not stale).
5. Measure cache-hit rate under FEAT-R's load test before/after.

**Expected result:** inventory-service's catalog-item reads show a
measured L2 cache-hit rate under load, and an explicit test proves a
write correctly invalidates the cached entry — not just that caching
exists.

### ENH-001 — Redis distributed cache

**Steps:**
1. Add Redis to the Compose stack.
2. Replace inventory-service's Caffeine catalog cache with a
   Spring-Data-Redis-backed one, same TTL semantics.
3. Add explicit invalidation on admin catalog writes (publish an
   invalidation message or directly evict the Redis key — don't rely on
   TTL alone, same reasoning as ENH-014).
4. Run two replicas of inventory-service behind the gateway's load
   balancer; write via one replica's admin endpoint, read via the other;
   confirm the second replica sees the update within the TTL window
   without its own local cache lying to it.
5. This is also the shared store FEAT-Q (distributed rate limiting)
   needs — if both are being done, share the same Redis instance/config
   rather than standing up two.

**Expected result:** a multi-replica consistency test passes (write on
replica A visible on replica B within TTL), proving the actual gap
ENH-001 exists to close — Caffeine alone cannot do this, which is the
whole point of the change.

### ENH-016 — Postgres advisory locks

**Steps (requires the (a)/(b) decision in `BACKLOG.md` first):**

*If (a) — migrate one service to Postgres:*
1. Pick the lowest-risk service (not order/inventory/payment, which are
   mid-fix — `discovery-server` or `config-server` don't need this
   pattern; a throwaway clone of one service is safer than touching a
   real one).
2. Swap the JDBC driver/Testcontainers dependency, convert Liquibase
   changelogs' DB-specific syntax if any, verify tests pass on Postgres.
3. Implement one real coordination problem with
   `pg_try_advisory_lock(key)` (e.g. "only one scheduler instance runs
   the expiry sweep at a time") instead of the existing
   `@Version`-based optimistic locking.
4. Write a test proving two concurrent callers, only one gets the lock.

*If (b) — learn the pattern against MySQL instead:*
1. Implement the same coordination problem using `GET_LOCK(name,
   timeout)` / `RELEASE_LOCK(name)`.
2. Write the same concurrent-callers test.
3. Write the comparison doc: session-scoped vs. connection-scoped lock
   semantics, timeout behavior, and what's genuinely different about
   Postgres's advisory locks versus MySQL's named locks.

**Expected result:** one real "only one instance should do this"
coordination problem solved with an advisory-lock-style mechanism, a
passing concurrency test, and (if (b) was chosen) a written comparison
explaining what Postgres's actual advisory locks would have added.

---

## Track 3 — Security Hardening (ENH-019, FEAT-Q)

### ENH-019 — JWT key rotation, audience validation, OAuth2 gaps

**Steps:**
1. Change `auth-service`'s `JwtConfig.jwtEncoder()`/JWKS publishing to
   support multiple keys keyed by distinct `kid` — the JWKS endpoint
   should be able to publish an array, not always exactly one entry.
2. Implement a rotation procedure: introduce `key-2`, publish both
   `key-1` and `key-2` in the JWKS response, start signing new tokens
   with `key-2`, keep `key-1` published until the last token it signed
   expires (1 hour, per the current fixed `exp`), then remove it.
3. Write the proving test: a token signed under `key-1` still validates
   while both keys are published; after `key-1` is removed, it
   correctly fails.
4. Add audience (`aud`) validation to at least one resource server
   (`order-service` is a good pilot) using
   `JwtValidators.createDefaultWithIssuer(...)` plus an added audience
   validator — test that a token without the right `aud` is rejected.
5. If scoping in a fuller OAuth2 story: add a refresh-token endpoint
   with rotation (old refresh token invalidated on use) before
   considering a full Authorization Server migration — this is the
   highest-value incremental step short of adopting Spring Authorization
   Server wholesale.

**Expected result:** a real rotation test passes (old key still
verifies during overlap, fails cleanly after retirement) — this directly
closes the gap found while writing ADR 003. At least one service
enforces audience. `docs/architecture/adr/003-jwt-jwks-security.md` and the
`docs-security/jwt/*` pages on
[shopverse-docs](https://taukhir.github.io/shopverse-docs/security/) get
updated to reflect the fix once it lands, since they currently document
this as an open gap.

### FEAT-Q — Gateway-level distributed rate limiting

**Steps:**
1. Reuse the Redis instance from ENH-001 if both are being done.
2. Replace (or add alongside) the gateway's per-instance Resilience4j
   `RateLimiter` with a Redis-backed limiter (Bucket4j with its Redis
   backend is the standard Spring Cloud Gateway pairing, or Spring
   Cloud Gateway's own `RequestRateLimiter` filter with a Redis
   `RateLimiter` implementation).
3. Key the limit per API-key or per authenticated subject, not per
   gateway instance.
4. Run two gateway replicas behind a load balancer; hammer one client's
   requests across both replicas; confirm the limit is enforced
   globally, not doubled because each replica had its own counter.
5. Confirm the existing default `CircuitBreaker`/`Retry` filters (ADR
   001) still compose correctly with the new rate-limit filter — order
   of filters matters in Spring Cloud Gateway.

**Expected result:** a client exceeding its limit gets throttled
consistently regardless of which gateway replica serves the request —
proven by the two-replica test, not assumed from single-instance
testing.

---

## Track 4 — Platform Experiments (bounded, isolated)

### FEAT-Y — Migrate one service to Quarkus

**Steps:**
1. Pick `discovery-server` or `config-server` as the target (lowest
   business-logic risk, per the BACKLOG note) — not a service with
   active bug work (order/inventory/payment).
2. Scaffold the Quarkus equivalent in a separate module/branch; don't
   delete the Spring Boot version until the comparison is done.
3. Reimplement its actual behavior (for discovery-server: registration/
   health; for config-server: serving `cloud-configs/`).
4. Measure: cold start time, memory footprint (RSS at idle), and build
   time for a native image (`quarkus build --native`) versus the Spring
   Boot JAR's startup and footprint.
5. Write the comparison: DI model differences (build-time vs. runtime),
   dev-mode live-reload experience, and whether native-image's
   reflection-config overhead was worth the startup-time win for this
   specific service.
6. Decide: keep both as a permanent comparison artifact, or retire the
   Quarkus version once the learning is captured — either is fine, this
   doesn't need to become the new production service.

**Expected result:** a working Quarkus reimplementation of one real
service with measured startup/memory/native-build numbers against the
Spring Boot original, and a written verdict on the tradeoff — not just
"Quarkus is faster," the actual numbers and why.

### FEAT-Z — Reactive (WebFlux) read-path experiment

**Steps:**
1. Pick inventory-service's public catalog read endpoint (non-
   transactional, read-heavy — the right shape for reactive to help).
2. Add R2DBC alongside the existing JPA/JDBC stack for this one read
   path (don't convert the whole service — this entity is also written
   via the normal transactional JPA path elsewhere).
3. Reimplement the read endpoint reactively end to end: R2DBC
   repository → `Mono`/`Flux` → WebFlux controller.
4. Load test both versions (blocking JDBC vs. reactive R2DBC) at
   increasing concurrency with FEAT-R's tooling; find the concurrency
   level where they diverge, if any.
5. Write up the result honestly, including a "they performed about the
   same" outcome if that's what happens — the lesson in `MVC-VS-WEBFLUX.md`
   is that reactive only wins when the whole call chain is non-blocking,
   and this experiment should prove or disprove that directly.

**Expected result:** a working reactive read endpoint with a real
before/after throughput comparison against the blocking version under
load — the number is the deliverable, not just "now it's reactive."

### ENH-017 — Liquibase performance tuning

**Steps:**
1. Time a fresh-install migration run for each service
   (`docker compose up` from empty volumes, measure time to
   "DATABASECHANGELOG fully applied").
2. Identify the slowest changeset(s) — likely a seed changeset
   inserting many rows, or a changeset with an expensive precondition
   check.
3. Fix the specific slow one: batch inserts, simplify or remove an
   unnecessary precondition, or split a huge changeset into smaller
   ones if lock duration (not just total time) is the problem.
4. Re-time; report the specific before/after delta.

**Expected result:** a named slow changeset, a specific fix, and a
measured before/after time — not a general "Liquibase should be faster"
claim.

### ENH-018 — Flyway comparison exercise

**Steps:**
1. Pick one real, already-applied Liquibase changeset from any service
   (a simple "add column" one is easiest to compare fairly).
2. In a throwaway branch, write the equivalent as a Flyway versioned SQL
   migration (`V1__add_column.sql`) against a cloned copy of that
   service.
3. Run both against a fresh database; confirm both produce the same
   schema.
4. Write the comparison: SQL-first vs. YAML-declarative authoring,
   rollback story (Flyway's paid-tier-only automatic rollback vs.
   Liquibase's built-in rollback tags), and versioning model
   (timestamp/sequential files vs. changeset IDs).
5. Do **not** propose replacing Liquibase repo-wide unless the
   comparison genuinely changes your mind — this item exists to produce
   the comparison, not to justify a tool swap.

**Expected result:** one real schema change implemented both ways, with
a written, specific (not generic) comparison of the two tools' actual
mechanics — usable directly as interview material on migration-tool
tradeoffs.

### ENH-020 — Clarify "use multiple databases"

**Steps:**
1. Before writing any code: answer which of these is actually meant —
   (a) read replicas for a read-heavy service, (b) a different DB engine
   for a specific workload (e.g. a document store for product search),
   or (c) this was already satisfied by the existing per-service-schema
   model and the real need is something else.
2. If (a): add a MySQL read replica to Compose, point inventory-service's
   catalog reads at it via a routing `DataSource`, verify writes still
   go to the primary.
3. If (b): name the specific workload first (search is the obvious
   candidate, already flagged as missing platform-wide), then evaluate
   a document/search store for that workload specifically, not as a
   generic "add another DB" exercise.

**Expected result:** depends entirely on which disambiguation is
chosen — the actual deliverable here is the clarifying decision itself,
which this roadmap can't make for you.

---

## Track 4b — AI Features (FEAT-AA, FEAT-AB, FEAT-AC)

Build in this order — each depends on the one before it.

### FEAT-AA — Read-only MCP tool server

**Steps:**
1. Create a new `ai-service` (per the existing POC plan's own recommendation
   for isolation — separate provider dependencies, independent scaling,
   easier cost/API-key control).
2. Add the Spring AI MCP server starter; implement each tool from
   `MCP-SPRING-SHOPVERSE-LAB.md`'s capability table as a thin adapter that
   delegates to a domain query service — the domain service enforces
   ownership even if the MCP layer already checked it (defense in depth,
   matching this repo's existing security posture).
3. Wire each tool to the real backend: `get_order_status`/`get_order_timeline`
   call order-service, `check_inventory`/`search_catalog` call
   inventory-service, `get_payment_status` calls payment-service (never
   exposing provider secrets), `get_service_health` calls the existing
   Eureka/actuator health surface.
4. Implement the redaction/size-limit/audit step the lab's sequence diagram
   calls for before any result leaves the server.
5. Run the lab's 10-item test matrix: initialize/capability negotiation,
   valid owner/operations-role calls, cross-user denial without existence
   disclosure, oversized-argument handling, indirect prompt injection via
   catalog/order text, timeout/cancellation/disconnect, audit redaction and
   trace propagation, old/new client compatibility, rate/concurrency limits.
6. Do **not** add any mutation tool (cancel/refund/stock-adjustment) in this
   pass — that's explicitly gated behind its own authorization/approval/
   idempotency/reconciliation work per the lab's Mutation Gate.

**Expected result:** a real MCP client (Claude Desktop, or any MCP host)
can call `get_order_timeline` for an order it owns and get real, redacted
data back; the same call for another customer's order is denied without
revealing whether that order exists. All 10 test-matrix cases pass.

### FEAT-AB — Customer-facing AI assistant (chat + RAG + recommendations)

**Steps (the POC plan's own 4 phases):**
1. **Phase 1 — minimal chat.** Add `/api/ai/chat` to `ai-service`; configure
   the LLM provider API key from environment (never committed); add
   timeout/error handling; return a simple response DTO.
2. **Phase 2 — document RAG.** Write the sample knowledge documents
   (return/shipping/refund policy, product guide, FAQ); add an ingestion
   endpoint that chunks, embeds, and stores them in a vector DB (PGVector or
   Qdrant per the POC plan); add `/api/ai/rag/ask` returning an answer plus
   cited sources, with an explicit "not found" fallback — never answer a
   policy question from the model's general knowledge.
3. **Phase 3 — product recommendation.** Have the LLM extract search intent
   as validated JSON only; call inventory-service (or FEAT-AA's
   `search_catalog` MCP tool if that's already built) for the real product
   data; have the LLM write the final explanation using only what came back
   — never let it invent a SKU, price, or product name.
4. **Phase 4 — observability and hardening.** Add the metrics the POC plan
   names (`shopverse.ai.chat.requests`, `.rag.retrieval.duration`,
   `.provider.latency`, etc.); confirm API keys/tokens/full customer
   questions are never logged; write the demo script and README.

**Expected result:** a policy question only gets answered from retrieved
document context with a cited source, or an explicit "I don't know"; a
product recommendation request never returns a product that doesn't
actually exist in inventory-service; token/cost/latency are visible in
Prometheus, not just "it works."

### FEAT-AC — AI Incident Investigator (back-office ops copilot)

**Steps:**
1. Add 3 new read-only MCP tools to FEAT-AA's server, ops-role-gated (not
   customer-facing): `query_logs_by_correlation_id` (wraps a LogQL query
   against the existing Loki stack), `get_trace_by_id` (wraps the existing
   Zipkin API), `get_dlt_records_for_order` (wraps the existing DLT
   admin/recovery API already built into order/inventory/payment-service).
2. Build a Spring AI `ChatClient`-based endpoint
   (`POST /api/ai/incidents/investigate`) taking an order number or
   correlation ID.
3. Have it call the relevant tools (order timeline, logs, trace, DLT
   records) and pass the retrieved evidence — not general knowledge — as
   the only context for the LLM's narrative.
4. Write a strict system prompt: cite each claim to a specific piece of
   retrieved evidence (a timeline entry, a log line, a trace span, a DLT
   record) by name/timestamp; if the evidence doesn't support a conclusion,
   say so explicitly rather than guessing — same discipline as the RAG
   fallback in FEAT-AB.
5. **Validate it against a real, already-root-caused incident.** Reproduce
   BUG-013's own symptom (an order stuck at `ORDER_CREATED` despite
   `InventoryReservedEvent`/`PaymentCompletedEvent` having been published)
   in a disposable environment, run the investigator against it, and
   compare its narrative against the real root cause this repo already
   found by hand (`reliability/problems/ORDER-STATUS-DEAD-TRANSITION-PROBLEM.md`).
6. Do not add any replay/mutate tool to this endpoint, ever — it reads
   evidence and writes a narrative, nothing else, matching the explicit
   guardrail already stated in `FEATURES-RELIABILITY-OBSERVABILITY.md`'s
   roadmap note.

**Expected result:** given the real BUG-013 symptom, the investigator's
narrative correctly identifies that `PENDING_INVENTORY` was never assigned
and cites the specific timeline/log evidence that shows it — not a vague
"something went wrong with the order," a real, checkable root-cause claim.
This is the strongest possible demo for this feature: proving it reaches
the same conclusion a human engineer already reached by hand, on a bug
this repo has complete, documented ground truth for.

---

## Track 5 — Back-Office & Reconciliation (FEAT-S)

**Depends on Track 0 (BUG-013) being done first** — reconciling a SAGA
that can't reach `CONFIRMED` has nothing real to show.

**Steps:**
1. Design the console's scope first: payment reconciliation view
   (orders with `TIMED_OUT`/reconciled payments), stuck-SAGA view
   (orders sitting in a non-terminal state past an expected window), and
   DLT replay history (already has admin APIs — this is a UI, not new
   backend capability for that part).
2. Add the missing backend query endpoints (e.g. "orders in
   `PENDING_INVENTORY` for longer than N minutes") if they don't exist
   yet — check order-service's admin API surface first.
3. Build the Angular admin UI pages consuming those endpoints, following
   the existing Admin Activity page's pattern (backend audit data first,
   derived/operational signals as fallback, per
   `FEATURES-RELIABILITY-OBSERVABILITY.md`).
4. Add ownership/role protection (`ADMIN` only) consistent with every
   other admin surface in this repo.
5. Write an E2E test: seed a stuck order, confirm it surfaces in the
   console; replay a DLT event from the console, confirm the same
   effect as the existing admin API call.

**Expected result:** an admin can see stuck-SAGA orders, reconciled
payments, and DLT replay history in one UI, backed by real queries, not
mocked data — and can trigger a replay from the UI with the same
guarantees as the existing API.

---

## Track 6 — Infrastructure (Kubernetes → Canary → AWS)

### FEAT-U — Kubernetes manifests/Helm chart

**Steps:**
1. Start with one service's Deployment/Service/ConfigMap manifests by
   hand (order-service is a good first one — it has the most complete
   actuator health/readiness setup to map to K8s probes).
2. Map existing Spring Boot Actuator health groups to K8s
   liveness/readiness probes properly (don't just point both at
   `/actuator/health` — differentiate liveness from readiness the way
   this repo's own readiness semantics already distinguish them at the
   gateway).
3. Repeat for the remaining 7 services, then externalize common bits
   (image, resources, probes) into a Helm chart with per-service
   `values.yaml` overrides.
4. Add Kafka/MySQL/Redis as Helm dependencies or separate manifests
   (Bitnami charts are the standard starting point, swap for the real
   thing later).
5. Verify the full stack comes up via `helm install` with the same
   functional checkout flow working end to end as it does under
   Compose.

**Expected result:** `helm install shopverse ./chart` brings up a
functionally equivalent stack to Compose, with real liveness/readiness
probes (not just "container didn't crash") driving K8s's restart/traffic
decisions.

### FEAT-V — Canary/rolling deployment strategy

**Depends on FEAT-U.**

**Steps:**
1. Pick a K8s-native progressive-delivery tool (Argo Rollouts or Flagger
   are the standard choices) and install it against the FEAT-U cluster.
2. Define a canary strategy for one service (order-service): e.g. 10%
   traffic to the new version, pause, check a real health signal
   (error-rate metric from the existing Prometheus setup), promote or
   roll back automatically.
3. Simulate a bad deploy on purpose (deploy a version that returns 500s
   on checkout) and confirm the canary catches it and rolls back before
   100% of traffic shifts.
4. Document the health signal used and the promotion/rollback thresholds
   chosen, with reasoning.

**Expected result:** a demonstrated automatic rollback from a simulated
bad deploy, with evidence (the specific metric and threshold) of what
triggered it — not just "canary is configured."

### FEAT-W — AWS infrastructure (EKS, ECR, EC2, S3)

**Requires your explicit go-ahead on AWS account, budget guardrails, and
a teardown plan before any resource is created.**

**Steps (once approved):**
1. Set up ECR repositories; push one service's image manually first to
   confirm auth/permissions work before automating anything.
2. Stand up a minimal EKS cluster (smallest viable node group) — budget
   and teardown plan agreed *before* this step, not after.
3. Deploy the FEAT-U Helm chart against the real EKS cluster instead of
   local K8s (minikube/kind).
4. Point MinIO's role (product media) at a real S3 bucket instead,
   comparing the two directly (MinIO is S3-API-compatible, so this
   should be close to a config change, not a code change — if it isn't,
   that's itself a useful finding).
5. Tear down everything (cluster, load balancers, ECR images if not
   needed) immediately after the exercise, and confirm the teardown
   actually removed billable resources — don't leave an EKS cluster
   running by accident.

**Expected result:** at least one service's image built, pushed to ECR,
and running on a real EKS cluster, with MinIO's S3-compatible usage
validated against real S3 — and confirmed, verified teardown with no
lingering billable resources.
