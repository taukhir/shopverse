# Capacity Plan — 20M Requests/Day

Companion to [`BACKLOG.md`](BACKLOG.md)/[`ROADMAP.md`](ROADMAP.md). This
answers a specific question raised 2026-11-17: can ShopVerse handle 20
million requests/day, including traffic spikes, and what has to change to
get there? Written by the Senior Developer with Diego Alvarez's and Elena
Vasquez's standing technical positions folded in — not a new team
discussion, a synthesis of what this backlog already knows plus the
capacity math that was missing.

## The Honest Headline

**20M requests/day is not a large number for a well-architected system.**
It does not require sharding, multi-region, or anything exotic. What it
*does* require is closing gaps already found in this backlog — several of
which are currently mis-filed as "correctness bugs" when at this volume
they are also **scalability blockers**, plus three things never built at
all (distributed cache, CDN, horizontal scaling). The honest story here is
"finish what's already tracked, in the right order," not "redesign the
platform."

## The Math

- 20,000,000 requests/day ÷ 86,400 seconds/day ≈ **231 req/s average**.
- E-commerce traffic is never flat. Using industry-typical peak ratios:
  - **Normal daily peak** (evening/business-hours concentration): ~5×
    average ≈ **1,150 req/s**.
  - **Marketing-campaign/flash-sale spike**: ~15× average ≈ **3,500 req/s**
    — this is the number to design against, not the average.
- Traffic is not uniform in kind. A realistic e-commerce split:
  - **~90% read traffic** (catalog browse, product detail, search, order
    status lookup) → at the 3,500 req/s peak, **≈3,150 req/s reads**.
  - **~10% write-ish traffic** (cart mutation, checkout attempts, payment)
    → **≈350 req/s**, of which actual *completed* checkouts (cart
    abandonment is real and high) are maybe a third → **≈120 req/s real
    checkout writes at peak**.

That last number matters most: the system doesn't need to do 3,500
transactional writes/second — it needs to serve ~3,150 cheap reads/second
and ~120 expensive writes/second, at the same time. Those are different
problems with different fixes, and conflating them is how a capacity plan
goes wrong.

## Bottleneck-By-Bottleneck, Against What's Already Found

### Reads (~3,150 req/s target)

1. **No distributed cache exists** (`ENH-001`, not yet built). Every one
   of those 3,150 req/s would hit MySQL directly for catalog/price data
   today. This is the single highest-leverage fix for the read path —
   Redis, with the multi-replica invalidation story `ENH-001` already
   specifies.
2. **No CDN fronts static assets/product images** (MinIO-served directly
   today) — not previously tracked as its own item; adding it now as
   `FEAT-AO` below. At this request volume, serving images through the
   app tier at all is wasted capacity.
3. **No horizontal scaling infrastructure exists** (`FEAT-U`, Kubernetes,
   not yet built). Compose runs exactly one instance of everything. Reads
   can't scale out until there's an orchestrator with autoscaling.
4. **Unbounded/unpaginated list queries** (`BUG-030`) and the **missing
   index on `orders.customer_username`** (`BUG-033`) get *categorically*
   worse at this scale, not just slower — `getRelated()`'s full-table
   scan-and-sort on every product-detail view was already flagged as bad
   at demo scale; at 3,150 req/s on that one endpoint alone, it's a
   guaranteed outage, not a performance nit.

### Writes (~120 req/s checkout target)

5. **HikariCP pool (5 connections) vs. Resilience4j bulkhead (100
   concurrent calls)** — `BUG-028`, already found as a ~20:1 mismatch at
   *demo* scale. At 120 real writes/s needing a DB transaction in
   order-service, inventory-service, *and* payment-service each, this
   isn't a mismatch anymore, it's a wall. Pool sizing has to be revisited
   against this specific number, not a guess.
6. **Kafka: single broker, listener concurrency defaults to 1**
   (`infra/cloud-configs/application.yml`'s `KAFKA_LISTENER_CONCURRENCY:1`,
   found during the performance audit). At 120 `OrderCreatedEvent`s/s,
   a single-threaded consumer in inventory-service processes them one at
   a time — this alone caps real throughput far below the target
   regardless of anything else. Needs partition count increased and
   listener concurrency raised to match, which also means revisiting
   `BUG-034`'s per-order serialization fix so added concurrency doesn't
   reopen the race it closes.
7. **Shared gateway circuit breaker across all routes** (`ADR 001`'s own
   Consequences section) — under real spike load, one struggling service
   tripping the shared breaker state would incorrectly degrade routes to
   healthy services too. Needs per-route breaker instances before any of
   this is safe to scale.
8. **Gateway/service rate limiters sized for demo traffic** (100 req/s
   per service default, from the same config `BUG-028` already flagged)
   — these need to be resized against the real 3,500 req/s peak target,
   and `FEAT-Q`'s distributed (Redis-backed) limiter needs to exist so the
   limit means the same thing across however many gateway replicas are
   running, not a per-instance fiction.
9. **Idempotency and concurrency correctness bugs compound under real
   concurrent load, not just in theory.** `BUG-022` (idempotency key
   regenerated on retry), `BUG-035`/`BUG-036` (silent corruption under
   races) — all already Critical/High severity on correctness grounds
   alone — become *more* likely to actually fire once real concurrent
   write volume exists, not less. These are prerequisites for scaling
   writes, not independent of it.

### Data layer at this volume

10. At ~120 checkout writes/s sustained, order/payment/inventory tables
    grow fast — this is the point where `ENH-037`'s "no retention/purge
    policy" and `BUG-032`'s "no backup/recovery strategy" stop being
    hygiene items and become operational risks with a real blast radius.
11. MySQL read replicas become a real, specific need at this read volume
    — this is the disambiguation `ENH-020` ("clarify multiple databases")
    was waiting on. **Answer: read replicas for the catalog-read path,
    specifically**, not a generic "add more DBs."

## New Item Found During This Analysis

| ID | Title | Owner | Affected |
|---|---|---|---|
| FEAT-AO | CDN in front of static assets and product media | platform | inventory-service, frontend-site |

**Requirement:** product images and any other static assets are served
through a CDN, not directly from MinIO/the app tier. **Expected result:**
at the target read volume, image/asset requests never reach
inventory-service or the gateway at all. **Source:** found during the
2026-11-17 capacity-planning exercise — not previously tracked anywhere.

## The Phased Plan

This reuses `ROADMAP.md`'s existing execution order — the capacity work
isn't a separate track bolted on, it's *why* several already-queued items
matter more than their current position suggests.

| Phase | Work | Why it's a prerequisite |
|---|---|---|
| **0** | `BUG-013`, `BUG-034`–`039` (the full concurrency/ordering sweep) | Correctness bugs that get strictly worse under real concurrent load — fixing them is not optional before scaling, it's the floor. |
| **1** | `BUG-028` (pool/bulkhead resize), Kafka listener concurrency + partition count, `FEAT-R` (load testing — needed to *prove* the resize against this specific target, not guess) | Closes the write-path ceiling. |
| **2** | `ENH-001` (Redis cache), `FEAT-AO` (CDN, new), `BUG-030`/`BUG-033` (pagination + index fixes) | Closes the read-path ceiling — this is most of the 3,150 req/s problem. |
| **3** | `FEAT-U` (Kubernetes + autoscaling), per-route circuit breakers (ADR 001 follow-up), `FEAT-Q` (distributed rate limiting, resized against 3,500 req/s) | Makes the fixed capacity *horizontally scalable*, not just bigger on one box. |
| **4** | MySQL read replica for catalog reads (resolves `ENH-020`), `ENH-037`/`BUG-032` (retention + backup, now with real data volume) | Data-layer scaling once the above proves the app tier can actually use it. |

**What this plan deliberately does NOT include, and why:** database
sharding, multi-region active-active, or a service mesh as a *capacity*
requirement (service mesh, `FEAT-AD`, is still worth doing for the
zero-trust reasons already logged — just not because 20M req/day needs
it). At this volume, that complexity would be solving a problem ShopVerse
doesn't have.

## What Would Actually Break Today, Named Specifically

If 3,500 req/s hit the current stack unchanged: the shared HikariCP pool
exhausts in seconds (`BUG-028`), the single-threaded Kafka consumer falls
permanently behind and the backlog grows unbounded, `getRelated()`'s
full-table scan saturates MySQL CPU on its own, and the single-instance
gateway's shared circuit breaker trips and degrades every route at once
the moment any one service slows down. None of this is hypothetical —
every piece is a specific, already-cited line of code or config value,
not a general "it probably can't handle load" guess.
