---
slug: /mycheckout/interview-prep/part-6
title: "mycheckout — Checkout Platform: Interview Preparation — Part 6"
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

# mycheckout — Checkout Platform: Interview Preparation — Part 6

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `INTERVIEW-PREP.md` |
| Source SHA256 | `d66d6ba6319504f369415902a6e00eb5d3899fda752d33ddc02b69eb911129ef` |
| Guide part | 6 of 7 |

[Part 1](/mycheckout/interview-prep/part-1) · [Part 2](/mycheckout/interview-prep/part-2) · [Part 3](/mycheckout/interview-prep/part-3) · [Part 4](/mycheckout/interview-prep/part-4) · [Part 5](/mycheckout/interview-prep/part-5) · [Part 6](/mycheckout/interview-prep/part-6) · [Part 7](/mycheckout/interview-prep/part-7)

## Q13. How do we manage inventory without issues? {#q13-how-do-we-manage-inventory-without-issues}

### Say this {#say-this-12}

<a id="shared-40afbd1766f6"></a>

> "Inventory has three safeguards. **One source of truth per market**: our own stock ledger in Postgres for Japan, Manhattan for the other markets, chosen by a config switch. **Serialised writes**: every reservation takes a lock per item and warehouse, re-checks availability, and appends a new version, so two customers can't both get the last unit. **Idempotency everywhere**: reservations and releases are keyed by reference id, feed updates by event id. Planning is separate from committing: allocation at checkout is read-only, reservation happens only at place order, stock is consumed when the order is ready for fulfillment, and released on cancel or payment failure."

### Go deeper {#go-deeper-6}

<a id="shared-362d6144b4ee"></a>

| Lifecycle step | What happens (code) |
|---|---|
| Feed in (Japan) | AS400 → Kafka (Protobuf) → event service → data service writes a new ledger version: end-of-day sets absolute on-hand, intra-day applies deltas, status-only updates change disposition |
| Allocation (checkout) | Read-only: computes ATS and disposition per line (ship, backorder, not available); in-memory map so lines share stock |
| Reservation (place order) | Advisory lock per (item, warehouse, country), keys sorted to avoid deadlocks, re-validate, append version with `reserved += qty`; shortfall → 409 → "out of stock" modification |
| Payment fails | Reservations deleted, loyalty points refunded |
| Order ready for fulfillment | Sales-order event → on-hand adjustment (consume stock) |
| Order cancelled | Sales-order event → release |
| Stock change → storefront | CDC → availability event → product/search |
| Feed errors | Retryable → retry topic (3 tries), else dead-letter topic |

### Be honest: "without any issue" is too strong {#be-honest-without-any-issue-is-too-strong}

Say "we have strong safeguards, and here are the gaps I found and what I'd do":

<a id="shared-69f97ed72eaf"></a>

- **Backorder double deduction** on repeated allocations (the SHIP_ELSE_BACKORDER bug; fix branches exist).
- **Reserve and pay run in parallel** in the default market path, so a payment can start for stock that then fails to reserve (compensated, but extra work).
- **No automatic expiry** of ledger reservations; abandoned ones rely on payment-failure cleanup.
- Raw availability can go **negative** after a feed (sellable ATS is clamped to 0) and nothing alerts on it.
- Some feed messages (delta updates) aren't fully deduplicated on replay; a retry-topic publish failure is only logged.
- Two providers (ledger vs Manhattan) mean different behaviour per market.

### Likely follow-ups {#likely-follow-ups-12}

<a id="shared-21d4feca5c78"></a>

- **"Oversell vs undersell: which do you prefer?"** For most retail, slight undersell (safety stock, subscription protection quantity) is better than cancelling paid orders. Our ATS subtracts a subscription protection quantity for that reason.
- **"How do you reconcile with the warehouse system?"** The end-of-day feed resets on-hand to the warehouse's absolute figure; for flagged SKUs it can also sync the reserved quantity.
- **"Backorders?"** A separate backorder pool and reserve; disposition rules per item decide ship vs backorder vs not available.

---

## Q14. How does multi-tenancy work in our architecture? {#q14-how-does-multi-tenancy-work-in-our-architecture}

### Say this {#say-this-13}

<a id="shared-c3912bfa2ad4"></a>

> "We use a **hybrid model**. Each regional tenant, global, Japan, Thailand, LATAM and AP2, is a **separate deployment** in its own Kubernetes namespace, with its own config, tables, topics and release approvals. Inside a tenant that serves several markets, like AP2 with three affiliates, one deployment serves all of them but **data is still separated per affiliate**: one DynamoDB table set per affiliate, one Postgres schema per affiliate, Kafka topics with the affiliate code in the name. The request carries the tenant and country in headers, we put it in a tenant context, and the data layer resolves the right table from it. Behaviour per country comes from strategies, master data and feature flags."

### Go deeper (code/config) {#go-deeper-codeconfig}

<a id="shared-7b579f77430a"></a>

| Layer | Mechanism |
|---|---|
| Deployment | Namespace per `<tenant>-<env>` (inferred from the DNS pattern); internal DNS `http://<service>.<tenant>-<env>/<service>`; Helm values per tenant and env; separate approvals per tenant |
| Request context | "Tuple" headers carry country/affiliate; biz picks country strategies from them (`TupleService`) |
| Reactive context | Data service registers the tenant code as a propagated context (`TenantContextHolder` with Micrometer context-propagation), so it survives thread hops in WebFlux |
| Data, DynamoDB | Tables per affiliate, e.g. `checkout<affiliate><tenant><env>`, plus per-affiliate order-sequence and profile tables; repository resolves the table name at call time for the current tenant |
| Data, Postgres | Schema per affiliate (e.g. `<affiliate>.address`), CDC connector per affiliate |
| Startup | Per-tenant initialisation loops over all configured tenants (order sequence, checkout profile) |
| Kafka | Topic name `commerce_<env>_<affiliateCode>_<entity>_…`; consumers set tenant from the affiliate code; the product publish service extracts the tenant from the topic name when its multi-tenant flag (`nx.framework.instance.enabled`) is on |
| Config | `configmap.yml` + `configmap_<tenant>_<env>.yml`; per-market master data; flags evaluated per tenant |
| Behaviour | Country strategies (Japan, LATAM, Mexico, default) choose handler pipelines |

### Trade-offs {#trade-offs-7}

<a id="shared-2ccfcec83587"></a>

- **Silo per region:** strong isolation, smaller blast radius, data residency per region, independent releases. Cost: more deployments, infrastructure and config drift between tenants (e.g. a hard-coded topic in one tenant's config).
- **Pooled compute, siloed data inside AP2:** cheaper than one deployment per affiliate, data still separated. Risk: **noisy neighbour** (one affiliate's sale affects the others) and **context leaks**: if async code loses the tenant context, it would hit the wrong table, which is why context propagation matters.
- Why not one shared table with a tenant-id column? Cheaper and simpler to operate, but weaker isolation, harder per-market deletion/retention, and hot partitions shared across markets.

### Likely follow-ups {#likely-follow-ups-13}

<a id="shared-cd883a1f75d1"></a>

- **"How do you onboard a new market?"** Add tenant/affiliate config, tables and topics via CDK, master data and flags, map the country to a strategy (or default), Helm values, approvals.
- **"How do you prevent cross-tenant data access?"** Separate tables/schemas, tenant resolved from request headers (I would confirm the gateway sets or validates them rather than trusting the client), per-tenant IAM roles and Kafka service accounts.

---

## Additional question bank {#additional-question-bank}

Short, speakable answers. **(code)/(config)** = seen in the repos; otherwise it's general knowledge or reasoning, so say "I'd" or "typically".

### A. Scaling {#a-scaling}

**A1. Are the services stateless?** Yes for the app and biz tiers; state lives in DynamoDB, Postgres, Redis and Kafka. That's what allows horizontal scaling and KEDA.

<a id="shared-aef09ad81365"></a>

**A2. KEDA vs HPA?** HPA scales on CPU/memory. KEDA adds event sources such as queue length, so we can scale before CPU rises. KEDA drives an HPA underneath. (config: KEDA with CPU + month-end + flash-sale SQS triggers on checkout biz.)

<a id="shared-0b201a67ce26"></a>

**A3. How do you scale the database tier?** DynamoDB scales by partition; you design keys to spread load. Aurora Serverless v2 scales capacity units automatically (0.5–128 in one tenant's config); read replicas are available but not configured there.

<a id="shared-035de0b48373"></a>

**A4. How do you scale Kafka consumers?** One consumer per partition per group, so the partition count is the ceiling. Increase partitions (keys stay ordered per partition, but re-partitioning changes key mapping), run more replicas, or use batch consumption (order eventservice does).

<a id="shared-d234a1a87a4f"></a>

**A5. What limits scaling today?** Hot key on the per-country order counter, 3 partitions on hand-off topics, connector concurrency of 1, fan-out to 25 services, lock contention on hot SKUs.

<a id="shared-ff35e47bf4de"></a>

**A6. How would you handle 10× traffic?** Load test to find the first bottleneck. Then: shard the order counter, raise partitions, pre-scale downstream dependencies (payment, promotions), add short-lived caching for read-only lookups (product, master data), protect with rate limits and load shedding at the edge, and queue orders for async payment if payment becomes the limit.

<a id="shared-00b526f1be8c"></a>

**A7. Connection pools?** Quarkus app tier REST client pool 500, event loops 64 (config). Too small causes queuing; too large overloads the downstream service. Size from measured concurrency.

### B. Rate limiting and resilience {#b-rate-limiting-and-resilience}

<a id="shared-ae23f1ac4cb8"></a>

**B1. How do we rate limit?** Honest answer: there is **no rate limiting in the service code or Helm values** in this workspace. If it exists, it's at the edge (API gateway, WAF, CDN or Istio ingress), which isn't in these repos. What the services do have: per-client timeouts, a 22 s mesh timeout on biz, idempotency keys, optimistic locking and KEDA.

<a id="shared-cb510c759017"></a>

**B2. How would you add it?** Token bucket at the gateway (Istio/Envoy local rate limit per pod, or global rate limit with a Redis-backed rate-limit service), keyed by client id, user or IP, with different limits for anonymous vs logged-in users and for partners. Return 429 with `Retry-After`. Protect expensive endpoints (place order, GET checkout recalculation) more tightly.

<a id="shared-8e3fc4360f07"></a>

**B3. Algorithms?** Token bucket (allows bursts), leaky bucket (smooth rate), fixed window (simple, edge bursts), sliding window log/counter (accurate). For distributed limits use Redis with atomic Lua scripts or the Envoy rate-limit service.

<a id="shared-c329a1b3361d"></a>

**B4. Circuit breakers?** Not found in checkout biz code or config; protection relies on timeouts. I'd add circuit breakers and bulkheads (Resilience4j for Spring, SmallRye Fault Tolerance for Quarkus) on optional dependencies like loyalty, segmentation and promotions, with a fallback that degrades rather than fails the order. Never auto-retry non-idempotent calls like payment without an idempotency key.

<a id="shared-d9ac9f500c23"></a>

**B5. Retries?** Kafka consumers: RLQ with a retry count then DLQ (code). HTTP: retry only idempotent operations, with exponential backoff and jitter, and a retry budget so retries don't amplify an outage.

<a id="shared-e5ed7c6c79fc"></a>

**B6. Load shedding / graceful degradation?** Ideas: skip non-critical handlers when a dependency is down (the pipeline already supports excluding handlers by master data), serve stale product data, queue orders for async processing.

### C. Security (beyond Q9) {#c-security-beyond-q9}

**C1. Authentication vs authorisation here?** Authentication: JWT validated in the mesh. Authorisation: OPA policies (scopes per API, ownership for checkouts).

<a id="shared-8c6cba1fa1f2"></a>

**C2. What is IDOR and how do you prevent it?** Insecure direct object reference: accessing someone else's resource by changing an id. Prevent with an ownership check on every request, not just create. (Relevant hardening item from Q9.)

<a id="shared-b7fd8b3c1ce9"></a>

**C3. Service-to-service trust?** Network policies, mesh identity, tokens with an actor claim, IRSA for AWS. I didn't verify mTLS settings in the mesh; Istio supports it and it's usually on in strict mode.

**C4. Secrets management?** SSM Parameter Store, injected at deploy; no secrets in images. I'd add rotation and secret scanning in CI.

**C5. PII?** Addresses in per-market Postgres schemas, TTL on checkouts, no PII in logs (a hardening item), encryption at rest via AWS defaults (not verified in config).

**C6. Payment data / PCI?** Card data stays with the payment service and provider; checkout stores selections and transaction references only (as far as I saw).

**C7. Supply chain?** Dependabot, Sonar, private CodeArtifact, internal base images, minimal native runtime images.

<a id="shared-23600f448c40"></a>

**C8. Policy as code — why OPA?** Policies live in Git next to the service (`policies-as-code/`), are tested and deployed with it, and are evaluated in a sidecar, so the auth logic is consistent across services and languages.

### D. Design choices {#d-design-choices}

<a id="shared-5c2e145082a1"></a>

**D1. Why a handler pipeline with country strategies?** Markets differ in steps (slots, invoice numbers, tax thresholds, pickup holds). A strategy picks an ordered list of small handlers; stages run in parallel where independent. Adding a market means a new list, not new branches everywhere. Trade-off: the flow is harder to follow in a debugger and needs good logging.

<a id="shared-740e42953f76"></a>

**D2. Why return HTTP 200 with "modifications" instead of errors?** Business outcomes (out of stock, payment declined, price changed) aren't failures; the UI needs a structured reason to guide the user. Real errors still use 4xx/5xx.

<a id="shared-00ecfe012abf"></a>

**D3. Why contract-first (OpenAPI/AsyncAPI) with generated code?** Contracts are versioned in their own repo, server stubs and clients are generated, so producers and consumers can't drift silently.

**D4. Why Avro + CloudEvents + schema registry?** Compact binary, enforced schemas with compatibility rules, standard envelope (type, source, id) for routing and tracing.

<a id="shared-d3418fb45963"></a>

**D5. Why feature flags (flagd/OpenFeature)?** Ship dark, enable per tenant, kill switches. Two place-order implementations coexist behind one flag. Trade-off: flag debt (many registered flags have no backend reference).

<a id="shared-42d58c1f0b4d"></a>

**D6. Why reactive (WebFlux / Mutiny)?** The services are I/O-bound fan-outs. Non-blocking I/O handles more concurrent requests per pod with fewer threads. Trade-off: harder debugging and stack traces; blocking calls by mistake can stall the event loop.

**D7. Why an append-only stock ledger?** Audit trail, concurrency control by versions, CDC can compare version N with N−1 to decide what to publish.

**D8. Why TTLs on checkout and sales orders?** Checkouts are transient; the system of record for orders is EOM and order history. TTL keeps tables small and limits PII retention.

<a id="shared-591f0bf52818"></a>

**D9. Multi-tenancy model?** Separate deployment per tenant (regional), tenant/affiliate code in topic names and config, country from request headers selects strategies. Isolation is strong; the cost is more deployments to manage.

<a id="shared-6deba033faca"></a>

**D10. Why CDC instead of publishing from code?** Avoids the dual-write problem: the event exists if and only if the DB write committed. Trade-off: event shape follows the table shape; schema changes in the table affect consumers.

### E. System design prompts (answer outlines) {#e-system-design-prompts-answer-outlines}

<a id="shared-9bfa09377bce"></a>

**E1. "Design a checkout system for a multi-country store."** Requirements (place order, per-market rules, payments sync/async, peaks) → API (create, update, place order, idempotency key) → storage (document store per checkout with version) → orchestration (pipeline of steps, per-market config) → stock reservation before or with payment → state machine (CREATED → AWAITING_PAYMENT → ORDER_CREATED) → publish via outbox/CDC → downstream via Kafka → scale (stateless, autoscale, timeouts, rate limits) → security (authz per resource) → observability. This is our system; use it as the worked example.

<a id="shared-b3a36c650a7d"></a>

**E2. "Prevent overselling in a flash sale."** Strong consistency on the stock counter: row lock or conditional update (`UPDATE … SET reserved = reserved + q WHERE available >= q`), idempotent by reservation id, reservation expiry for abandoned checkouts, hot-SKU strategies (split stock into buckets, pre-allocate quotas per pod, queue requests), show availability from an eventually consistent read model. Ours: advisory lock + append-only version + re-validate, 409 on shortfall.

<a id="shared-a53e1011bb1e"></a>

**E3. "Generate unique, human-readable order numbers at scale."** Atomic counter (ours, per country) → hot key. Better: hi/lo blocks per pod, sharded counters, or Snowflake-style ids (time + node + sequence) if gaps and non-sequential numbers are acceptable to the business.

<a id="shared-cd0780a88921"></a>

**E4. "Reliable event publishing from a service."** Transactional outbox (outbox table + relay) or CDC from the DB log (ours). Consumers idempotent; retry topic + DLQ; replay from offsets.

<a id="shared-ace1ca284b3c"></a>

**E5. "Idempotent payment API."** Client idempotency key stored with the result; same key returns the stored result; payment provider called with the same key; state machine on the payment record; reconciliation job for unknown outcomes (timeouts).

<a id="shared-e8bdbd31050b"></a>

**E6. "Design order history for millions of users."** CQRS: write model in transactional stores, read model in OpenSearch fed by events; S3 as immutable event archive for rebuilds. Ours exactly.

<a id="shared-5c841a742a35"></a>

**E7. "Find the nearest pickup points."** Geo index (Redis GEOSEARCH or PostGIS/OpenSearch geo), source of truth in a DB, periodic loaders from partners, filter by availability, sort by availability then distance. Ours, including the gaps (stale members, key prefix mismatch) as lessons.

### F. Fulfillment and inventory (from the fulfillment docs) {#f-fulfillment-and-inventory-from-the-fulfillment-docs}

Full bank of 54 questions: `fulfillment/docs/FULFILLMENT-INTERVIEW-PREP.md`. The most likely ones:

<a id="shared-2c558f641af0"></a>

- **What does fulfillment do?** Stock (ATS, allocation, reservation), pickup locations, delivery fees and dates.
- **Two inventory providers:** a config switch selects the in-house ledger (Japan) or Manhattan (other markets).
- **Allocation vs reservation:** allocation is read-only planning; reservation re-checks under lock and writes.
- **Japan feed:** AS400 → Kafka (Protobuf) → event service → data service writes a new ledger version (absolute end-of-day, delta intra-day, status-only) → CDC → availability event to product/search.
- **Stock is consumed** on the sales-order "ready for fulfillment" event and released on cancellation, not when checkout returns.
- **Feed failure handling:** retryable errors to RLQ (3 attempts, 30 s), others to DLQ. Known gap: an RLQ publish failure is only logged.
- **Reservation expiry:** no automatic expiry for ledger reservations was found; the 6-minute TTL is the pickup-point token in Redis.

### G. Project and behavioural {#g-project-and-behavioural}

<a id="shared-112ba49cc468"></a>

**G1. "Biggest technical challenge?"** Pick one you owned, e.g. tracing the backorder double-deduction bug across checkout, fulfillment and the EOM adaptor; or understanding place-order concurrency (reservation and payment in parallel) and its compensation paths.

<a id="shared-e07fc3b057a2"></a>

**G2. "Tell me about an incident."** Structure: symptom (order placed but missing in order history) → triage using the runbook (checkout status → CDC DLQ → adaptor logs → sales-order status → republish) → root cause → fix → prevention (alert, test).

<a id="shared-b7aa755eadde"></a>

**G3. "What would you change in the architecture?"** See the closing list: order counter, reserve-before-pay, partitions, ownership checks, right-size Quarkus pods, smoke tests, flag cleanup.

<a id="shared-35696ec58412"></a>

**G4. "How do you onboard onto a large codebase?"** Start from contracts and flows, trace one request end to end, write it down (the end-to-end doc), verify claims against config, not old docs.

### H. Retail and e-commerce domain questions {#h-retail-and-e-commerce-domain-questions}

Common in interviews for retail projects. "Ours" = what this platform does (code/config); the rest is a good general answer.

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
