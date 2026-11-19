---
slug: /mycheckout/interview-prep/part-2
title: "mycheckout — Checkout Platform: Interview Preparation — Part 2"
mdx:
  format: md
difficulty: Advanced
page_type: Reference
status: maintained
scope: generic
owner: docs-mycheckout
reviewer: documentation-maintainers
review_evidence: imported-source-documentation-link-and-build-check
last_reviewed: "2026-11-16"
---

# mycheckout — Checkout Platform: Interview Preparation — Part 2

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `INTERVIEW-PREP.md` |
| Source SHA256 | `d66d6ba6319504f369415902a6e00eb5d3899fda752d33ddc02b69eb911129ef` |
| Guide part | 2 of 7 |

[Part 1](/mycheckout/interview-prep/part-1) · [Part 2](/mycheckout/interview-prep/part-2) · [Part 3](/mycheckout/interview-prep/part-3) · [Part 4](/mycheckout/interview-prep/part-4) · [Part 5](/mycheckout/interview-prep/part-5) · [Part 6](/mycheckout/interview-prep/part-6) · [Part 7](/mycheckout/interview-prep/part-7)

<a id="shared-dbebc5b75e4f"></a>

## Q2. Why is payment called synchronously from checkout, and the event triggered afterwards? {#q2-why-is-payment-called-synchronously-from-checkout-and-the-event-triggered-afterwards}

<a id="shared-5e1cafbf7475"></a>

**Reading note added 2026-11-12:** the explanation below is a simplified interview narrative, not a universal market contract. Current `DefaultNormalPlaceOrderStrategy` combines reservation and payment with `Mono.zip` and contains fix-forward `ORDER_CREATED` behavior; Japan normal flow validates reservation first. See the [market-specific sequence and failure flow](/mycheckout/interview-prep/part-7#place-order-sequence-with-a-market-specific-branch). CDC uses committed changes as its source, but filtering does not establish exactly-once delivery or prove that all downstream orders are already paid.

### Say this {#say-this-1}

<a id="shared-92d7dfb6a61e"></a>

> "Payment is part of the customer's place-order request because the customer needs an answer on the page: accepted, pending, or 'try another card'. So checkout biz reserves stock and calls the payment service inline, and from the result decides the status: `ORDER_CREATED`, `AWAITING_PAYMENT`, or a failure with a message back to the UI. Only **after that status is committed** do we publish, and we don't publish from application code at all: the DynamoDB stream emits the event when the record transitions to `ORDER_CREATED`. That gives us 'publish if and only if the order was saved', without a two-phase commit."

### Go deeper {#go-deeper-1}

Place-order flow (E2E §6, §8.3):

<a id="shared-be70d77dc46e"></a>

1. Load the checkout, re-run the market's handler pipeline (prices, promotions, tax, stock).
2. **Reserve inventory** and **process payment**. In the default market path these run **in parallel**; in Japan they run **sequentially** (reserve, then pay, then preorder reserve).
3. Map the payment result:
   - `AUTHORIZED` / `CAPTURED` / `AWAITED` → `ORDER_CREATED`.
   - `INITIATED` (asynchronous methods, for example bank transfer or a redirect) → `AWAITING_PAYMENT`.
   - Failure → reservations released, loyalty points refunded, status stays `CREATED`, and a "payment failed" **modification** is returned with HTTP 200 so the UI can show it.
4. Persist with the version check, then side effects in parallel (checkout profile, registration, cart deleted asynchronously).
5. **Event:** the stream filter selects the transition into `ORDER_CREATED`. Later updates remaining in that status do not qualify, but connector retries and replay can still deliver duplicates; this is not an end-to-end exactly-once guarantee.
6. **Async payments:** when the payment completes later, a `salesorderpayments` event arrives; the EOM adaptor sees the checkout is `AWAITING_PAYMENT` and calls place-order again, which flips it to `ORDER_CREATED` and fires the stream (E2E §6.6).

```
Customer ─▶ app ─▶ biz: reserve ∥ pay ─▶ data: PUT status=ORDER_CREATED ─▶ 200 to customer
                                                   │ (DynamoDB stream, filtered)
                                                   ▼
                                        Kafka checkout_raw ─▶ EOM adaptor ─▶ salesorder (stream) ─▶ Kafka ─▶ EOM, fulfillment, order history
```

### What the code shows vs. why {#what-the-code-shows-vs-why-1}

<a id="shared-a3645bf24de1"></a>

- **Shows:** payment client called from biz with a 15 s timeout; status mapping in `PaymentServiceImpl`; stream filter config; async completion consumer in the EOM adaptor; no direct Kafka publish of the order from biz.
- **Reasoned:** (a) the UX needs a synchronous decision; (b) **the dual-write problem**: writing to the DB and to Kafka from code can leave one without the other. Using the DB's change stream is a form of the **transactional outbox / CDC pattern**: the event exists if and only if the write committed; (c) downstream systems (EOM, warehouse) should only ever see paid or payment-pending-confirmed orders, never abandoned carts.

### Trade-offs {#trade-offs-1}

<a id="shared-159447283493"></a>

- **No distributed transaction** across stock, payment and the checkout record. Partial failures rely on compensation: release reservation, refund points, retry.
- Running **reserve and pay in parallel** (default path) cuts latency but means payment can be authorised for stock that then fails to reserve, which needs a reversal. Japan runs them sequentially, which is safer but slower. Good thing to raise yourself.
- Tail latency: payment is the slowest dependency (15 s timeout under a 22 s mesh timeout).
- At-least-once delivery downstream: the adaptor treats "already exists" as success, so replays are idempotent.

### Likely follow-ups {#likely-follow-ups-1}

<a id="shared-7598df8adbf2"></a>

- **"What if payment succeeds but the DB write fails?"** The order is not `ORDER_CREATED`, so no event is published and nothing is shipped. The customer or client retries place-order (retry flow). I did not verify in code whether an automatic void/refund happens in that case, so I'd say "it relies on retry and payment-side reconciliation; I'd add an explicit void or a reconciliation job".
- **"Why not a saga orchestrator?"** The pipeline in biz is effectively an orchestrated saga for the synchronous part, with explicit compensation steps. The post-order part is choreography via Kafka. A dedicated orchestrator (e.g. Step Functions, Temporal) would add durability for long-running steps but more infrastructure.
- **"How do you guarantee exactly one event per order?"** The filter selects the transition into `ORDER_CREATED`; it does not guarantee exactly-once delivery. Explain the connector's delivery contract and the specific consumer's deduplication behavior. Do not assume every consumer is idempotent.
- **"Why go through the EOM adaptor instead of publishing directly to EOM?"** It enriches and validates the order (product, promotion, tax, address), shields EOM from checkout's internal model, and gives a place for retry/DLQ and manual republish.

---

## Q3. How are we caching in ATS? {#q3-how-are-we-caching-in-ats}

If the question is specifically about **Redis** (TTL, invalidation, cache miss), go to **Q11**.

I read "ATS" as **available-to-sell** (inventory in the fulfillment domain). If you meant something else, adjust the opening line.

### Say this {#say-this-2}

<a id="shared-988e32bc6ebf"></a>

> "We deliberately **don't cache stock numbers**. For the markets on our own ledger, ATS is **computed at read time** from the latest committed ledger row in Postgres: on-hand minus reserved minus backorder reserve minus subscription protection, clamped at zero. Stock changes constantly and a stale cache means overselling, so correctness wins. What we do instead is **push** availability changes: every ledger change goes through CDC, and fulfillment publishes an availability event only when something meaningful changes (in stock, backorder, out of stock), which product and search consume for display. Redis exists in fulfillment, but it's for the pickup-location geo index and short-lived pickup tokens, not for stock."

### Go deeper {#go-deeper-2}

<a id="shared-aeeb641ab4d6"></a>

- **Provider switch:** `config.ats-service` selects the source. Base config uses **Manhattan** (external OMS inventory); **Japan** uses the in-house **NextGen ledger** (config). For Manhattan markets we call their API; our code adds no cache on top (no cache annotations or cache managers found in the fulfillment data service).
- **Formula (code, NextGen ledger):** `onHandATS = max(0, onHand − reserved − backorderReserve − sopProtection)`; `backorderATS = max(0, backorderQty − backorderReserve)`. Disposition rules (ship, backorder, temporarily not available, etc.) are applied per line.
- **Consistency on write:** reservation takes a Postgres **advisory lock per (item, warehouse)**, keys sorted to avoid deadlocks, re-checks ATS, and appends a new version. Two shoppers for the last unit: the second sees ATS 0 and gets a 409, which checkout turns into an out-of-stock message.
- **Per-request "cache":** allocation keeps an in-memory stock map for the request so line 2 sees line 1's consumption (bundles and duplicates).
- **Read model for browse traffic:** Postgres CDC → `stocklevel_raw` → fulfillment event service → `inventory-availability_pub` → product/search. The publish predicate compares disposition, dates and status, not every numeric change, which keeps event volume down.
- **Redis (fulfillment):** ElastiCache over TLS, cluster mode in some prod tenants. Used for GEO sorted sets of pickup locations and pickup-check tokens with a 360 s TTL.
- **Other "caching" in the platform:** master data and feature flags are held in memory by shared starters; order history is served from OpenSearch rather than the transactional stores.

### What the code shows vs. why {#what-the-code-shows-vs-why-2}

<a id="shared-4b78b5038eb1"></a>

- **Shows:** no stock cache; read-time computation; advisory locks; CDC-driven availability events; Redis only for geo and tokens.
- **Reasoned:** the expensive and high-volume reads (product listing pages, search) don't call ATS at all; they read the pushed availability in product/search. ATS is only called on the checkout path, where accuracy matters and a primary-key read on one ledger row is cheap.

### Trade-offs {#trade-offs-2}

<a id="shared-f77841f691e5"></a>

- Read-time computation puts load on the primary Postgres (no reader replicas configured in the one config I checked). At very high checkout volume you'd consider read replicas for allocation (planning) while keeping reservations on the primary.
- The pushed availability is **eventually consistent**: a product can show "in stock" for a moment after the last unit is reserved. The reservation 409 is the safety net.

### Likely follow-ups {#likely-follow-ups-2}

<a id="shared-a6c23d4ad148"></a>

- **"If you had to add a cache, how?"** Cache only for display (short TTL, e.g. seconds, keyed by item+warehouse, invalidated by the CDC event), never for reservation decisions. Or keep the push model and let product/search be the cache.
- **"How do you stop overselling?"** Lock, re-validate, append, all inside one transaction; idempotent by reference id.
- **"What about hot SKUs during a flash sale?"** Lock contention on one row is the bottleneck. Options: shard stock into buckets per warehouse/pool, pre-allocate quotas, or queue reservations.

---

## Q4. How do we handle huge reads and writes? {#q4-how-do-we-handle-huge-reads-and-writes}

### Say this {#say-this-3}

<a id="shared-05bf878e5a49"></a>

> "We separate the paths. **Writes** go to stores that scale horizontally or are tuned for the job: checkout to DynamoDB with conditional writes and no locks, stock to Postgres with fine-grained locks per SKU and warehouse. **Reads** are by primary key or a GSI, and heavy read use cases get their own read models: order history in OpenSearch, product availability pushed via events. And anything that doesn't have to happen inside the customer's request is moved to **Kafka**, so writes return fast."

### Go deeper (E2E §11) {#go-deeper-e2e-11}

**Writes**

<a id="shared-cfc295888054"></a>

- Checkout: DynamoDB conditional writes, optimistic `version`; big or group checkouts are compressed and split into several rows, group rows written with `TransactWriteItems`.
- Idempotency key on create, so client retries don't double-write.
- Stock: per-key advisory locks, sorted lock order, append-only rows (writes never update in place, which also gives an audit trail).
- Sales orders: very large orders stored compressed and published manually to avoid the 400 KB item limit.
- Async side effects: cart deletion, order indexing, warehouse stock consumption all happen after the response.

**Reads**

<a id="shared-c117df03ce9a"></a>

- Checkout reads by `Id` or via the `OrderIdIndex` GSI (keys-only, then a get).
- `GET checkout` recalculates live (prices, promos, stock, tax), so it's correct but costly; there is a switch to disable recalculation for POS.
- Order history from OpenSearch, isolated from checkout.
- Event consumers in the order service read in **batch mode** with manual acks and write to S3 asynchronously.

**Compute**

<a id="shared-0e68c9f2d66e"></a>

- Biz is reactive (WebFlux). Independent handlers in a stage run in parallel (`Flux.merge`), and every downstream client has its own timeout (product 1.5 s, fulfillment 2–3 s, payment 15 s), so a slow dependency can't tie up threads.

### What the code shows vs. why {#what-the-code-shows-vs-why-3}

<a id="shared-8799e3a82490"></a>

- **Shows:** everything listed, from code and config.
- **Not shown:** load-test results, production capacity mode of DynamoDB (dev is provisioned 5/5; prod configs don't set it), actual peak TPS. Say "I don't have the production numbers to hand" rather than inventing them.

### Trade-offs and risks to mention proactively {#trade-offs-and-risks-to-mention-proactively}

<a id="shared-dd9b16e07a19"></a>

1. Per-country order counter is a **hot key**.
2. `GET checkout` recalculating on every call is expensive at scale; a candidate for short-lived memoisation.
3. Biz fan-out: one place order calls 10–20 services; the slowest one defines tail latency.

### Likely follow-ups {#likely-follow-ups-3}

<a id="shared-632b615ab83e"></a>

- **"How would you shard the order counter?"** Hi/lo block allocation (each pod reserves 100 numbers at a time), or N counter shards with a suffix, if the business can accept non-contiguous numbers.
- **"How do you handle DynamoDB throttling?"** SDK retries with backoff, on-demand capacity or auto-scaling, and avoiding hot keys in the key design.
- **"Why reactive?"** Biz is I/O-bound fan-out; non-blocking I/O handles many concurrent downstream calls with few threads.

---

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
