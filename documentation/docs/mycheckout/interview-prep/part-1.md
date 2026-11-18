---
slug: /mycheckout/interview-prep/part-1
title: "mycheckout — Checkout Platform: Interview Preparation — Part 1"
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

# mycheckout — Checkout Platform: Interview Preparation — Part 1

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `INTERVIEW-PREP.md` |
| Source SHA256 | `d66d6ba6319504f369415902a6e00eb5d3899fda752d33ddc02b69eb911129ef` |
| Guide part | 1 of 7 |

[Part 1](/mycheckout/interview-prep/part-1) · [Part 2](/mycheckout/interview-prep/part-2) · [Part 3](/mycheckout/interview-prep/part-3) · [Part 4](/mycheckout/interview-prep/part-4) · [Part 5](/mycheckout/interview-prep/part-5) · [Part 6](/mycheckout/interview-prep/part-6) · [Part 7](/mycheckout/interview-prep/part-7)

## Checkout Platform: Interview Preparation {#checkout-platform-interview-preparation}

Prepared 2026-11-04 (expanded the same day) from the code and config in `D:\BE Projects\checkout` and from `docs/END-TO-END-SYSTEM.md` (referenced below as **E2E §n**).

## How to use this doc {#how-to-use-this-doc}

<a id="shared-bbbd3500181e"></a>

**Visual walkthrough added 2026-11-12:** [architecture, sequence, decision flow, stepwise answers and Java examples](/mycheckout/interview-prep/part-7#visual-interview-walkthrough). The existing question bank remains below. The new diagrams describe selected paths, not every market or operation.

Each question has four parts:

<a id="shared-cc3242721e21"></a>

1. **Say this (30 seconds).** A short answer you can speak as is.
2. **Go deeper (2 minutes).** The detail to add if the interviewer leans in.
3. **What the code shows vs. why (reasoned).** Design motives are never written in code. Keep the two apart when you speak: "the system does X" is a fact you can defend; "we did X because Y" is the most likely rationale. Saying "I believe the reason was…" is honest and sounds senior.
4. **Trade-offs and follow-ups.** The questions you will most likely get next, with short answers.

<a id="shared-7e50091dc7a7"></a>

**Contents:** 0. Pitch · Project overview · Q1–Q9 (your original questions) · Q10 Spring Boot → Quarkus · Q11 Redis and ATS caching · Q12 Nearby stores with Redis · Q13 Inventory safeguards · Q14 Multi-tenancy · Question bank: A Scaling, B Rate limiting and resilience, C Security, D Design choices, E System design, F Fulfillment, G Project and behavioural, H Retail domain, I Found in the coverage audit · Closing · Quick numbers.

Evidence tags: **(code)** Java source, **(config)** configmaps, Helm values, CDK, workflow files, **(docs)** existing repo docs, **(reasoned)** my rationale, not written anywhere.

<a id="shared-7c1d01eb8cb2"></a>

**Interview hygiene.** This is employer code. Talk about patterns, numbers of the shape "3 partitions, 22 s timeout", and design choices. Do not quote account ids, hostnames, Slack channels, topic names with tenant codes, customer data or credentials. When discussing security weaknesses (Q9), describe them as "hardening items I identified", not as how to exploit them.

---

## 0. The 60-second system pitch (open with this) {#0-the-60-second-system-pitch-open-with-this}

<a id="shared-7f0a1b8526a9"></a>

> "I work on the checkout domain of a multi-market e-commerce platform, running across several regional tenants such as Japan, Thailand and Latin America. Every domain (cart, checkout, fulfillment, order, product, tax) follows the same shape: an **app tier** that faces clients and does auth and validation, a **biz tier** that orchestrates, and a **data tier** that owns storage. Services are Java, Spring Boot WebFlux or Quarkus, on Kubernetes (EKS).
>
> Checkout biz runs a **pipeline of step handlers** chosen per country: products, promotions, rationing, fulfillment, tax, loyalty, payment and so on, about 45 handlers calling around 25 downstream services. The checkout itself is stored in **DynamoDB**. When the record flips to `ORDER_CREATED`, a **DynamoDB stream** filtered on that transition publishes an Avro event to **Kafka**. An adaptor service turns it into a sales order for the Enterprise Order Management system, and fulfillment and order-history services consume the same event. So the user-facing request is synchronous only up to 'order accepted', and everything after that is event-driven."

Then pause and let them pick a thread.

---

## Project overview (the 5-minute version) {#project-overview-the-5-minute-version}

Use this when the interviewer says "walk me through your project" and wants more than the pitch.

### What the platform is {#what-the-platform-is}

<a id="shared-42e7daed31a4"></a>

- A **multi-market e-commerce platform** for a direct-selling business: customers and distributors buy through web, mobile, POS (shops) and system channels such as subscriptions/auto-ship.
- Runs per **tenant** (regional deployment): global (dev/perf), Japan, Thailand, LATAM, and an AP2 tenant covering several Southeast Asian markets. Each tenant has dev, QA, UAT, perf and prod environments.
- Organised by **business domain**, each owned by a team: cart, checkout, fulfillment (stock, pickup points, delivery fees), order (history, returns, cancellations), product, taxation, plus a customer service portal.

### Architecture at a glance {#architecture-at-a-glance}

<a id="shared-4df12063e3cf"></a>

| Concern | Choice |
|---|---|
| Service shape | Per domain: `-api` contracts repo, app tier, biz tier, data tier, event service, job service |
| Languages / frameworks | Java (Java 21 on the Quarkus services). Spring Boot 3 (checkout biz/data/EOM adaptor; cart and product per their docs). **Quarkus 3 native** (checkout app tier, fulfillment app/data/event, order app/data, taxation, CSP) |
| Data | DynamoDB (checkout, cart, sales-order staging, locations), Aurora PostgreSQL (stock ledger, addresses, tax, order state), OpenSearch (order search), Redis (geo index), S3 (order event archive) |
| Integration | REST between tiers (generated clients from OpenAPI), Kafka with Avro + CloudEvents between domains, CDC from DynamoDB streams and Postgres |
| External systems | Enterprise Order Management (EOM), Manhattan (inventory/promising in most markets), AS400 (Japan inventory feed), payment, promotions, loyalty, Hybris (Japan preorder) |
| Platform | EKS, Istio, OPA, KEDA, Argo CD, Helm, CDK, CodePipeline, GitHub Actions, flagd feature flags, AWS AppConfig, SSM, Dynatrace and Prometheus |

### The core business flow {#the-core-business-flow}

<a id="shared-c36928e2eadc"></a>

1. Cart is priced (product, promotions, tax, stock).
2. Checkout is created from the cart; the customer picks delivery or pickup, payment and loyalty points. Each change re-runs the country's handler pipeline.
3. Place order: re-validate everything, **reserve stock**, **take payment**, set `ORDER_CREATED` (or `AWAITING_PAYMENT`).
4. DynamoDB stream → Kafka → EOM adaptor builds and validates a **sales order** → Kafka → EOM, fulfillment (consume/release stock), order history (archive + search).
5. Fulfillment ledger changes flow back as availability events to product and search.

### Things that make it interesting (good conversation hooks) {#things-that-make-it-interesting-good-conversation-hooks}

<a id="shared-f121321f9dc8"></a>

- **Per-market behaviour without forking code:** country strategies choose different handler pipelines (Japan has delivery slots, invoice numbers, handling fees; LATAM has tax thresholds; Mexico has pickup-point holds).
- **Business rule failures are not errors:** place order returns HTTP 200 with "modifications" (e.g. out of stock, payment failed) so the UI can guide the customer.
- **Event hand-off without dual writes:** CDC on the checkout table is the only way an order leaves checkout.
- **Predictable spikes:** month-end and flash sales, handled with KEDA queue-based pre-scaling.
- **Inventory correctness:** append-only stock ledger with advisory locks (Japan) vs Manhattan (other markets).

### Your role (fill in before the interview) {#your-role-fill-in-before-the-interview}

<a id="shared-3e0f60e50e53"></a>

Write 3–4 lines in your own words: which services you own, features you shipped, incidents you handled. Good candidates from this codebase, if they are yours: the SHIP_ELSE_BACKORDER allocation bug (double deduction of backorder stock on repeated allocations, fix branches across checkout app, EOM adaptor and fulfillment data), place-order handler work, the Spring Boot → Quarkus migration of the checkout app tier, the end-to-end documentation and security review.

---

## Q1. Why did we choose DynamoDB and PostgreSQL? {#q1-why-did-we-choose-dynamodb-and-postgresql}

### Say this {#say-this}

<a id="shared-7292cdef4cf4"></a>

> "We use each store for the access pattern it fits. The **checkout** and **cart** are document-shaped aggregates that we always read and write by id, at high volume, and that expire, so they live in **DynamoDB**: key-value access, horizontal scale, TTL, conditional writes for optimistic locking, and a change stream we use to emit events. Where we need **relational integrity and multi-row transactions**, mainly the **inventory ledger** in fulfillment, and also addresses, tax rules and order job state, we use **PostgreSQL** on Aurora."

### Go deeper {#go-deeper}

**Where each store is used (code/config):**

<a id="shared-ec8d8bad0f19"></a>

| Store | Used for | Why it fits |
|---|---|---|
| DynamoDB `checkout` table | Checkout aggregate, partition key `Id`, sort key `ChildId`, GSI `OrderIdIndex`, TTL 90 days, stream `NEW_AND_OLD_IMAGES` (E2E §6.5, §10.1) | One item per checkout, read/write by id; stream drives the order hand-off |
| DynamoDB `salesorder` table (EOM adaptor) | Sales orders, TTL 1 hour by default (E2E §7.1) | Acts as a short-lived **outbox**: write the record, the stream publishes it |
| DynamoDB `ordersequence`, `checkoutprofile`, cart tables | Order-number counter per country, saved checkout preferences, carts | Simple key access |
| DynamoDB (fulfillment) | Pickup locations, with a Redis geo index on top | Key lookups plus geo search in Redis |
| PostgreSQL (fulfillment) | **Stock ledger**: append-only versioned rows per (item, warehouse), advisory locks, reservations as counters (fulfillment docs) | Needs serialisable read-modify-write on hot rows and transactions |
| PostgreSQL (checkout data tier) | Addresses per market, Flyway migrations, CDC to an address topic via logical replication | Relational, schema-per-market, change capture |
| PostgreSQL (taxation, order data, CSP) | Tax rules and mappings; job/cancel/return state; CSP preferences | Relational rules and reporting |
| OpenSearch (order data) | Order history search | Search and read-heavy UI, isolated from transactional stores |

Postgres is provisioned as **Aurora Serverless v2** in at least one tenant's config (capacity range 0.5 to 128 ACU, slow-query logging at 50 ms, no reader replicas) **(config)**.

### What the code shows vs. why {#what-the-code-shows-vs-why}

<a id="shared-eceff4c9df22"></a>

- **Shows:** the placements above; optimistic locking via a DynamoDB version attribute; idempotent create with `attribute_not_exists`; checkout split and compressed across rows when it exceeds a configured size; stream filter on `Status` → `ORDER_CREATED`; fulfillment uses Postgres advisory locks and append-only versions.
- **Reasoned:** DynamoDB was chosen for checkout because the aggregate is schemaless and evolves per market (Japan has fields others do not), traffic is spiky, there is no need for joins, and the stream gives a reliable event source without a separate outbox table. Postgres was chosen for stock because "don't oversell" needs a strongly consistent, locked read-modify-write on a single counter, plus an auditable history, which is natural in SQL and awkward in DynamoDB.

### Trade-offs {#trade-offs}

<a id="shared-d48240e4aa0e"></a>

- DynamoDB: **400 KB item limit** (the data tier splits large or group checkouts across rows, and the EOM adaptor compresses large orders); **hot partitions** (the per-country order-number counter is a single item, roughly 1,000 writes/s ceiling per item); **no ad-hoc queries** (you need GSIs designed up front); transaction size limits.
- Postgres: connection and vertical-scale limits, mitigated by Aurora Serverless; lock contention on hot SKUs.
- Polyglot persistence means **no single transaction** across checkout (DynamoDB), stock (Postgres) and payment. Consistency is eventual and relies on compensation (see Q2).

### Likely follow-ups {#likely-follow-ups}

<a id="shared-5c91a4214c84"></a>

- **"How do you prevent two people editing the same checkout?"** Optimistic locking: every update carries `version`; a mismatch is rejected. One deliberate exception: a successful place order (`CREATED` → `ORDER_CREATED`) wins over a concurrent edit so a paid order is never lost (E2E §9.2).
- **"How do you avoid duplicate checkouts on retry?"** The id is derived from the client's idempotency key and written with a conditional put, so a retry returns the existing checkout.
- **"Why not just Postgres for everything?"** Could work at lower scale. Checkout is high write, short-lived (TTL), document-shaped and needs a change stream; DynamoDB gives all of that without managing sharding.
- **"Why not DynamoDB for stock?"** Possible with conditional updates on a counter, but the ledger needs versioned history, multi-key locking in a fixed order, and batch reservations; SQL is simpler to reason about.
- **"How do you generate order numbers?"** Atomic counter per country in DynamoDB. Mention the hot-key risk yourself and the fix: pre-allocate blocks of numbers per pod, or shard the counter.

---

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
