---
slug: /mycheckout/end-to-end-system/part-4
title: "mycheckout — NextGen Commerce: End-to-End System Guide — Part 4"
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

# mycheckout — NextGen Commerce: End-to-End System Guide — Part 4

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `END-TO-END-SYSTEM.md` |
| Source SHA256 | `4d1f4d3804f7dd242a206764ce0bbf48f087371f0c8bf643aa9ecd1038ae3228` |
| Guide part | 4 of 6 |

[Part 1](/mycheckout/end-to-end-system/part-1) · [Part 2](/mycheckout/end-to-end-system/part-2) · [Part 3](/mycheckout/end-to-end-system/part-3) · [Part 4](/mycheckout/end-to-end-system/part-4) · [Part 5](/mycheckout/end-to-end-system/part-5) · [Part 6](/mycheckout/end-to-end-system/part-6)

## 10. Security {#10-security}

### 10.1 Layers {#101-layers}

<a id="shared-3f43bbfc6674"></a>

| Layer | Mechanism | Evidence |
|---|---|---|
| Edge / mesh | Istio virtual services on `public` and `private` gateways (app tier also `partner`). Kubernetes network policy limits which services may call biz: checkout app, EOM adaptor, order app, OCC affiliate, subscription, random sales, fulfillment app, account search and booking | (config) `deployment-config/.../values-common.yaml` |
| JWT | `jwtValidation.enabled: true`, with exclusions (§10.2) | (config) |
| OPA sidecar (app tier) | `policy.rego`: allow when the STS token has an actor (`act.sub`), or the per-API rule passes. Per-API rules: `scope_required`, `scope_match_if_exists`, or `scope_match_if_exists_or_anonymous` (scope matches if a token exists, otherwise any `x-amw-anon-id` header passes) | (code) `policies-as-code/src` |
| OPA in app code | `checkoutPolicy.rego`: logged-in user id must equal the checkout profile id, or the anon id header must equal it. Any request with header `x-mycheckout-channel: POS` is allowed, with a comment saying this is temporary | (code) |
| Service-to-service | Internal DNS plus IRSA service-account roles (`AmsNextgenCommerce…SARole`). OAuth2 client credentials for Hybris (biz), Manhattan, Apigee and OCC (order app), Manhattan and Value Chain (fulfillment) | (config), CLAUDE.md |
| Secrets | SSM parameters mounted as env (for example `/nextgen-commerce/<tenant>-<env>/comcheckoutbs/hybrisIntegrationClientId`). Kafka API key and secret are env variables in order eventservice | (config) |
| Data at rest | DynamoDB TTL: checkout 90 days (`ttlInSeconds: 7776000` in the data-tier base configmap), sales order 1 hour by default. Address PII in PostgreSQL per market | (config) |

### 10.2 Findings that need a decision {#102-findings-that-need-a-decision}

These are read from code and config only. Each one should be confirmed with the platform or security team before acting on it.

<a id="shared-5efe491ebcaa"></a>

| # | Finding | Risk |
|---|---|---|
| S1 | The in-app ownership check (`OpaPolicyService.validate`) is called only from `createCheckout` (`CheckoutServiceImpl.doAuthorization`). GET, PATCH, payments and place-order by checkout id are protected only by the sidecar scope policy, which for most routes also accepts any `x-amw-anon-id` header | A caller who knows or obtains a checkout id may read or act on someone else's checkout. Checkout ids are UUIDs, which limits guessing but not leakage |
| S2 | `checkoutPolicy.rego` allows any request whose `x-mycheckout-channel` header is `POS` | A client-supplied header bypasses the ownership rule wherever that policy is used |
| S3 | Biz (`comcheckoutbs`) is attached to the **public** gateway with prefix `/` in common and LATAM/THA prod values, and its JWT exclusions cover nearly all `/v1/checkouts` methods | If the public route is reachable, biz can be called directly, skipping app-tier OPA. Network policy restricts pod-to-pod callers but not gateway traffic |
| S4 | `checkout.opa.enable` is `false` in biz and `true` in the app configmap. Biz relies entirely on the app tier and network policy | Defence in depth depends on S3 being closed |
| S5 | The biz base configmap points Hybris at a UAT host (`admin.uat9.mycheckoutlive.com`) for token and API; only Japan configmaps override it | Wrong environment or credential use if a non-Japan market enables preorder |
| S6 | `sample orders/NRC & RC Defect.txt` holds raw bearer tokens and personal data; Postman environment files may hold credentials | Credential and privacy exposure on laptops and in any shared copy |
| S7 | Order and checkout payloads (names, addresses, phones) are logged at DEBUG in several services (`LoggerUtil.logDebug(..., request)`) | PII in logs if DEBUG is enabled in production |
| S8 | `skip-step` and version-override logic are correctness controls, not security controls. Replaying a stale `version` on place order can still force-write | Integrity: worth a test |

---

## 11. Handling high order volume {#11-handling-high-order-volume}

How the system keeps reads and writes healthy under load, as declared in code and config. No load-test results are in this workspace.

### 11.1 Compute scaling {#111-compute-scaling}

<a id="shared-52ea7413b517"></a>

| Service | Mechanism | Values (prod) |
|---|---|---|
| checkout biz | KEDA, min 2 (THA 3) to max 15 replicas; scalers: CPU 75%, **month-end SQS queue** (factor 6), **flash-sale SQS queue** (factor 8). HPA settings exist (2–24) but `autoscaling.enabled: false` where KEDA is on | (config) `values-{jpn,latam,tha}-prod.yaml` |
| checkout biz pods | 0.5–1 CPU (THA 1–2), 2 GiB, JVM heap 50–70% of RAM | (config) |
| Reactive I/O | Biz is WebFlux; parallel handler stages (`Flux.merge`) cut latency per request; per-dependency timeouts stop slow services from holding threads | (code) |

The month-end and flash-sale scalers mean capacity is pre-scaled from external queue signals before CPU rises. The queues themselves are not defined in this workspace.

### 11.2 Write path {#112-write-path}

<a id="shared-8fc9c82a9603"></a>

| Concern | How it is handled | Limit / risk |
|---|---|---|
| Checkout writes | DynamoDB with conditional writes and optimistic `version`; no table locks | Concurrent edits get version errors (§9.2) |
| Large and group checkouts | The data tier serialises checkouts, compresses when enabled, and splits them into several rows when they exceed `dbRowSizeInBytes` or the transaction item limit; group rows are written with `transactWriteItems` | DynamoDB 400 KB item and transaction-size limits |
| Order id | One atomic-counter item per country in `ordersequence` | **Hot key:** every order in a country increments the same item. DynamoDB caps a single item at roughly 1,000 writes per second. Month-end peaks in one market all hit one partition |
| Stock | Fulfillment takes PostgreSQL advisory locks per `(item, warehouse)` before reading, sorts keys to avoid deadlocks, and writes append-only versions | Contention on hot SKUs; see fulfillment docs |
| Sales orders | Orders over `maxOrderLinesLimit` lines are stored compressed and published manually (`PUBLISHED_BINARY`) | Two publish paths to keep consistent |
| Table capacity | Dev uses provisioned 5/5 RCU/WCU. Prod configs do not set a billing mode, so the CDK construct default applies (not visible here) | Confirm on-demand vs provisioned for prod |

### 11.3 Read path {#113-read-path}

<a id="shared-24326ffed072"></a>

- **Checkout reads** are by partition key (`Id`) or by `OrderIdIndex` (keys-only GSI followed by a get).
- **`GET_CHECKOUT` recalculates every time.** It calls promotions, balance, inventory, fees and tax. The POS recalculation can be switched off (`disable.pos.checkout.recalculation`).
- **Master data and flags** are loaded by the chassis starters (in memory). flagd is synced over HTTP.
- **Fulfillment** serves locations from a Redis geo index and stock from the ledger (fulfillment docs).
- **Order history** is served from OpenSearch, not from the transactional stores. The heavy read traffic on old orders is isolated from checkout.

### 11.4 Asynchronous decoupling {#114-asynchronous-decoupling}

<a id="shared-76a0c7347a53"></a>

- Checkout returns as soon as the order is persisted. EOM, fulfillment consumption and order indexing all happen from Kafka.
- CDC connectors read DynamoDB streams with batch size 50–60, parallelization factor 3 and provisioned concurrency 1 per connector **(config)**.
- Japan prod topics `checkout_raw_v1` and `salesorder_pub_v1` have **3 partitions** **(config)**. This caps consumer parallelism per topic at 3 consumers per group.
- Order eventservice consumes in batch mode with manual acknowledgement and writes to S3 asynchronously.
- Failures go to RLQ and DLQ topics rather than blocking partitions (§18).

### 11.5 Throughput risks to watch {#115-throughput-risks-to-watch}

<a id="shared-17eb63b84621"></a>

1. Order-sequence hot key per country (§11.2).
2. Three Kafka partitions and connector concurrency of 1 for the hand-off topics. Under a flash sale, EOM latency grows even if checkout keeps up.
3. Biz fan-out: one place order calls 10 to 20 services. The slowest dependency (payment, 15 s timeout) sets the tail latency, under a 22 s mesh timeout.
4. Concurrent reservation and payment on the default path (§19 #1) increases compensation work when stock is contended.

---

## 12. Domain summaries {#12-domain-summaries}

### 12.1 Cart {#121-cart}

<a id="shared-ede94f705173"></a>

App → biz → data, Spring Boot. Data is DynamoDB (carts, entries, sub-carts). Cart biz aggregates product, fulfillment, promotion, account, tax, rationing, payment and subscription to price the cart. Checkout reads cart fields from the create-checkout request (`cartId`, entries, fired promotions, coupons, SOP metadata, fulfillment detail) and calls `comcartds` only to delete the cart after the order (§6.4).

### 12.2 Fulfillment {#122-fulfillment}

Fully documented already. Read `fulfillment/docs/README.md` first. Key points for the end-to-end picture:

<a id="shared-c98662421962"></a>

- `config.ats-service` chooses the provider. The base configmap sets `manhattan`; only Japan configmaps (and dev) set `nextgen`. So the NGC stock ledger, AS400 feed and reservation 409 behaviour apply to Japan **(docs, config)**.
- Checkout biz calls `comfulfillmentds` directly for allocations, delivery fees, reservations, slots and service locations. The fulfillment app tier is not on that path.
- Allocation is planning only. Reservation happens at place order. Stock is consumed later on the sales-order event, not when checkout returns.
- The Mexico pickup-point hold (Estafeta, Redis token, 360 s TTL) is separate from inventory reservation.

### 12.3 Order {#123-order}

<a id="shared-056f5c50ef20"></a>

- `comorderas` serves order history, returns, replacements, cancellations, invoices and tracking, using OMS, Manhattan, Apigee, checkout, payment and fulfillment.
- `comorderds` reads from OpenSearch and keeps job, cancel and return state in PostgreSQL (R2DBC).
- `comorderes` archives order, return and payment events to S3 and re-routes them (§7.2).
- Order API declares cancel-order and return-order CDC topics (`cancelorder_raw_v1`).

### 12.4 Product {#124-product}

<a id="shared-ca600810a26d"></a>

- `ingestservice` receives ContentStack webhooks and writes products, categories and bundles. It produces `bundle-avail-calc_raw_v1` and `bundle-price-event_raw_v1`.
- `publishservice` consumes product, price, inventory, category and classifier CDC topics and publishes `product_pub_v1`, `product-tuples_raw_v1` and search-index updates. One instance can serve several ap2 tenants when `nx.framework.instance.enabled=true` (see `product/commerce-product-publishservice-main/multi-tenancy-implementation.md`).
- Checkout biz reads products through `comproductbs` with a 1500 ms timeout **(config)**.

### 12.5 Taxation {#125-taxation}

<a id="shared-16a3ab4148ad"></a>

`comtaxationds` (Quarkus, PostgreSQL) calculates taxes and manages tax details and mappings, calling contact and fulfillment data services. Checkout biz has clients for both `comtaxationds` and `comtaxds` (not in workspace). Which one is used depends on the tax flags in §14 and on master data. The EOM adaptor can recalculate tax through the taxation service when `calculate.taxation.service.support.enable` is on.

### 12.6 CSP {#126-csp}

<a id="shared-51c862a9b88b"></a>

Customer Service Portal. Quarkus app and data services for Do-Not-Disturb preferences and Upsell Playbooks used by service agents, in PostgreSQL schema `csp`. It has no runtime link to the checkout order path in this workspace.

---

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
