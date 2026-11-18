---
slug: /mycheckout/end-to-end-system/part-6
title: "mycheckout — NextGen Commerce: End-to-End System Guide — Part 6"
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

# mycheckout — NextGen Commerce: End-to-End System Guide — Part 6

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `END-TO-END-SYSTEM.md` |
| Source SHA256 | `4d1f4d3804f7dd242a206764ce0bbf48f087371f0c8bf643aa9ecd1038ae3228` |
| Guide part | 6 of 6 |

[Part 1](/mycheckout/end-to-end-system/part-1) · [Part 2](/mycheckout/end-to-end-system/part-2) · [Part 3](/mycheckout/end-to-end-system/part-3) · [Part 4](/mycheckout/end-to-end-system/part-4) · [Part 5](/mycheckout/end-to-end-system/part-5) · [Part 6](/mycheckout/end-to-end-system/part-6)

## 18. Runbooks {#18-runbooks}

These are derived from code and config. Confirm with the team before using them in production.

### 18.1 Order placed in checkout but missing in EOM or order history {#181-order-placed-in-checkout-but-missing-in-eom-or-order-history}

<a id="shared-4c596b7cb4a8"></a>

1. Get the checkout by order id with `getCheckoutByOrderId` (`GET /comcheckoutbs/v1/checkouts` with the order id as a query parameter). Confirm the status is `ORDER_CREATED`. If it is `AWAITING_PAYMENT`, go to §18.3.
2. Check the CDC connector DLQ `checkout-comcheckoutds-dlq_error_v1` for the checkout id.
3. Check EOM adaptor logs for `CH_EOM_CONSUME_CHECKOUT_EVENT_INFO` / `CH_EOM_CHECKOUT_EVENT_ERROR` with the order id. Errors go to the RLQ.
4. Read the sales order: `GET /comcheckoutes/v1/salesorders/{salesOrderId}`.
   - `VALIDATION_FAILED` lists reasons in `orderEventStatusReason` and the entity is in `salesorder-comcheckoutes-dlq_error_v1`.
   - `PUBLISHED_BINARY` means a large order that was published manually.
5. Republish after fixing data: `PUT /comcheckoutes/v1/salesorders/{id}` sets `REPUBLISHED` (or `REPUBLISHED_BINARY`), and CDC publishes again. The sales-order record has a TTL (default 3600 s), so after expiry use `POST /v1/salesorders` instead.

### 18.2 Checkout events stuck in the RLQ {#182-checkout-events-stuck-in-the-rlq}

<a id="shared-9b1db3810806"></a>

- `readCheckoutEventRlq` is started by `CheckoutConsumerScheduler` every `checkout.event.consumer.scheduler.delayInMinutes` (300).
- The consumer stops itself when it reaches a message whose `lastProcessingTimestamp` header is in the future, controlled by `checkout.event.retry.last.processing.timestampInMinutes` (240).
- After `failed.event.retry.count.salesorder` (3) attempts the event goes to `checkout-comcheckoutes-dlq_error_v1`.
- To start or stop a binding by hand: `POST /comcheckoutes/update-consumer-binding` with `{"bindingKey": "...", "state": "STARTED" | "STOPPED"}`. The RLQ binding key is `SalesOrderConstants.CHECKOUT_EVENT_RLQ_CONSUMER_BINDING_KEY`.

### 18.3 Stuck in `AWAITING_PAYMENT` {#183-stuck-in-awaiting_payment}

<a id="shared-4516e35d9eaa"></a>

1. Confirm a payment event for the order reached `salesorderpayments_pub_v1`. It is also archived in the S3 payment bucket by `comorderes`.
2. Check EOM adaptor logs for `No checkout found for orderId` or `Invalid checkout response`.
3. Replaying the place order with only `version` (`POST /comcheckoutbs/v1/checkouts/{id}/place-order`) is what the adaptor does. Confirm payment success with the payment team first.

### 18.4 Place order returns modifications instead of an order {#184-place-order-returns-modifications-instead-of-an-order}

<a id="shared-49f835317025"></a>

Modifications come from validation in the handlers. Common causes are an inventory reservation 409 (stock changed after allocation), a pickup point that is no longer available (HTTP 410 from fulfillment), rationing or purchase restriction, tax-field validation, or a NO_CHARGE total that is not zero. The response `modification` / `modifications` carries the code. Fulfillment-specific causes are in `fulfillment/docs/FULFILLMENT-END-TO-END.md` §14.

### 18.5 Need to know which place-order code ran {#185-need-to-know-which-place-order-code-ran}

Check the flag `checkout.place.order.internal.handle.support.enable` in flagd for the tenant and environment.

<a id="shared-44f6057f508b"></a>

- **On:** logs show `CH_BIZ_EXECUTE_STEP_HANDLER_DEBUG` for `InventoryReservationStepHandler` and `PaymentProcessingStepHandler`.
- **Off:** logs show `CH_BIZ_NORMAL_PLACE_ORDER_INFO` from the legacy normal strategy.

---

## 19. Known gaps, risks and open bugs {#19-known-gaps-risks-and-open-bugs}

<a id="shared-16d558546865"></a>

| # | Item | Impact | Evidence |
|---|---|---|---|
| 1 | Default place order runs reservation and payment concurrently (legacy path, and the internal default sub-pipeline) | Payment can start for stock that then fails to reserve; relies on compensation | (code) `DefaultNormalPlaceOrderStrategy`, `DefaultInternalPlaceOrderStrategy` |
| 2 | No distributed transaction across checkout DynamoDB, fulfillment PostgreSQL, payment and Kafka | Partial failures need replay and compensation | (code), (docs) fulfillment docs §17 |
| 3 | SHIP_ELSE_BACKORDER double deduction in fulfillment allocation (`StockLevelResponseDataDto` overload) is **not fixed** on the allocation path in use; older bug notes claim it is, and old tests assert the old behaviour. Fix branches exist: `NCHECK-7668` (checkout appservice), `NCHECK-7884` (EOM adaptor), `NCHECK-8079` (fulfillment dataservice) | Wrong BO/SHP decisions on repeated allocations | (docs) `FULFILLMENT-END-TO-END.md` §15.3 |
| 4 | `commerce-checkout-jobservice` has no job code but runs hourly in global dev/qa | Wasted pods; misleading service catalogue | (code), (config) |
| 5 | `checkout.operation.place-order.step-handlers` is unused | Misleads readers into thinking pipelines are configurable | (code) |
| 6 | AR, CL, PA, CR are not in `LATAM_STRATEGY` | They get the default pipelines, not LATAM's tax threshold validation | (code) `StrategyEnum` |
| 7 | 32 registered flags have no backend Java reference; 3 flags read in code are not registered | Flag hygiene; behaviour depends on code defaults | §14 |
| 8 | Japan QA EOM adaptor hard-codes the sales order topic | Copy-paste risk across tenants | (config) |
| 9 | `sample orders/NRC & RC Defect.txt` contains raw bearer tokens and personal data | Credential and privacy exposure | file content |
| 10 | Security findings S1–S8 (§10.2): ownership checked only on create, POS header bypass, biz on public gateway | Possible unauthorised access to checkouts | (code), (config) |
| 11 | Order-sequence hot key and 3-partition hand-off topics (§11.5) | Throughput ceiling at month-end and flash sales | (code), (config) |
| 12 | Effective flag values and configmaps per environment are not visible here | Every behavioural statement depends on deployed flagd and configmaps | — |

---

## 20. Corrections to existing docs {#20-corrections-to-existing-docs}

<a id="shared-22e20eb11719"></a>

Applied on 2026-11-04 with Ahmed's approval, except where the last column says otherwise. CLAUDE.md files got a correction note at the top plus the overview and framework lines; the rest of their Spring-specific detail is flagged as out of date rather than rewritten.

<a id="shared-eacffbda6e94"></a>

| File | Said | Source shows | Status |
|---|---|---|---|
| `fulfillment/commerce-fulfillment-appservice/CLAUDE.md`, `…-dataservice/CLAUDE.md` | Spring Boot | Quarkus (Gradle builds). `fulfillment/docs` already notes this | Fixed |
| `checkout/commerce-checkout-appservice/CLAUDE.md` | Spring Boot 3 | Quarkus on the checked-out branch | Correction note added |
| `checkout/commerce-checkout-eomadaptorservice/CLAUDE.md` | "EOM (End-of-Month) adaptor" | EOM = Enterprise Order Management | Fixed |
| `checkout/commerce-checkout-bizservice/CLAUDE.md` | Place-order pipeline is "configurable" via the `step-handlers` property | Property unused; lists are hard-coded in strategy classes | Fixed |
| `docs/checkout-chat-history-2026-10-21.md` §7 | LATAM = CO, MX, HN, **ES**, GT | `StrategyEnum`: CO, MX, HN, **SV**, GT | Errata block added at the top; transcript kept as recorded |
| same, §8 | "Latam, Thailand, Mexico … none of them override `getHandlersForCreateOrder()`" | LATAM (and so Mexico) overrides CREATE_ORDER to add TAX_THRESHOLD_VALIDATION | Errata block added at the top; transcript kept as recorded |
| same, §8 | Classification exclusion makes a handler a no-op inside `isApplicable()` via `isExcludedByClassification`, and this implements BOOKING | `HandlerExecutor.prepareSteps` removes the handler using `isHandlerExcluded` and `HandlerConfig` master data (PREORDER plus client id). BOOKING exclusions are separate in-handler guards | Errata block added at the top; transcript kept as recorded |
| same, §10 | `CheckoutSopStepHandler` = "statement-of-purpose" | SOP is the subscription (auto-ship) programme; it calls `comsubscriptionds` | Errata block added at the top; transcript kept as recorded |
| `fulfillment/docs/FULFILLMENT-BUG-CONTEXT.md`, `fulfillment-availability-issue-fix.md` | SHIP_ELSE_BACKORDER fix applied | Not on the allocation path used (`FULFILLMENT-END-TO-END.md` §15.3) | Already carried a 2026-10-22 verification banner; no change needed |
| Checkout repos `README.md` (app, biz) | 33-byte placeholder | Should point to this guide | Replaced with a pointer to this guide |
| Checkout `mkdocs.yml` and `docs/index.md` | Default template | Should index this guide and the contracts | Not changed (config file) |

---

## 21. Coverage: what this guide does and does not establish {#21-coverage-what-this-guide-does-and-does-not-establish}

<a id="shared-41a89dd51e19"></a>

| Area | Coverage | Gap |
|---|---|---|
| Checkout order lifecycle, strategies, handler lists, place-order switch, CDC hand-off, async payment | Read from source and config | Deployed flag values and configmaps per environment |
| Individual handler internals (promotion maths, tax calculation, rationing rules, SOP, loyalty) | Named, with dependency | Not traced line by line. The promotion, tax and loyalty libraries are external jars |
| Legacy place-order strategies (`Japan/Latam/Thailand Normal/Pos/Retry`) | Default normal read | Country variants not read in full |
| Fulfillment | Summarised; detailed docs exist and are linked | — |
| Cart, product, taxation, CSP | Role, stack and integration points | Internal business logic not traced |
| Order domain | Event intake and storage read | Order app tier flows (returns, cancellations, invoices) and the OpenSearch indexer (not in workspace) |
| EOM, payment, promotion, account, profile and other external services | Contract level only | Behaviour outside this workspace |
| Security | Policies, JWT exclusions, gateway exposure and secrets config read | Not penetration-tested; the platform gateway and global ABAC policies are external |
| Scale | Autoscaling, partitions, connector settings, locking and data layout read | No load-test results or production metrics in the workspace |
| Web components (UI) | Not read | UI-scoped flags and front-end call order |

---

## 22. Where to read next {#22-where-to-read-next}

<a id="shared-79c1e4e00746"></a>

| Topic | Document |
|---|---|
| Fulfillment, everything | `fulfillment/docs/README.md` → `FULFILLMENT-REVERSE-ENGINEERING.md`, `FULFILLMENT-END-TO-END.md`, API and configuration catalogs |
| `POST /v1/orders` trace with DTO ownership | `docs/checkout-chat-history-2026-10-21.md` (read with the §20 corrections) |
| Japan order flow (business view) | `docs/Japan_Commerce_Order_Flow_Guide.docx` |
| Checkout biz conventions, BOOKING exclusions, downstream versions | `checkout/commerce-checkout-bizservice/CLAUDE.md` |
| EOM adaptor large-order design | `checkout/commerce-checkout-eomadaptorservice/CLAUDE.md` |
| Contracts | `checkout/commerce-checkout-api/source/*/v1/` |
| Every API operation, topic and CronJob across all domains | `docs/API-AND-EVENT-CATALOG.md` |
| What these docs do not yet cover | `docs/COVERAGE-AUDIT.md` |
| Interview preparation | `docs/INTERVIEW-PREP.md` |
| Product multi-tenancy | `product/commerce-product-publishservice-main/multi-tenancy-implementation.md` |
| Workspace map | https://claude.ai/artifact/PcV1TEzpid1U5iHjQh7m2f |

---

## 23. Additional flows found in the coverage audit (2026-11-04) {#23-additional-flows-found-in-the-coverage-audit-2026-11-04}

<a id="shared-91baaa21b3ec"></a>

These were missing from the first version of this guide. Evidence is **(code)** or **(config)** unless marked. The full list of operations and topics for every domain is in `docs/API-AND-EVENT-CATALOG.md`; what is still not traced is in `docs/COVERAGE-AUDIT.md`.

### 23.1 Loyalty points refund and the `loyaltybalancerecon_pub_v1` topic {#231-loyalty-points-refund-and-the-loyaltybalancerecon_pub_v1-topic}

<a id="shared-877b8823a6a3"></a>

When a payment fails after loyalty points were redeemed, biz must give the points back. `LoyaltyRefundExecutor` (biz) does this in one of two ways, chosen by flag `checkout.event.based.loyalty.refund` (code default `false`):

<a id="shared-def016f65287"></a>

| Flag | Behaviour |
|---|---|
| off (default) | Call the loyalty data service synchronously. **If that call fails, fall back to publishing** a refund reconciliation event |
| on | Always publish the refund reconciliation event (`publishLoyaltyRefundReconEvent` → `loyaltybalancerecon_pub_v1`, Avro) |

<a id="shared-1e7cb94c2383"></a>

Details: a loyalty payment entry already marked `FAILED` is skipped, which prevents double refunds; after a refund the entry is marked `FAILED`; metrics count published, failed and errored events. The consumer of the topic is outside this workspace (presumably the loyalty service).

<a id="shared-256bb6ae9307"></a>

**Gap:** the producer binding for this topic is only in the **global dev and perf** configmaps. No tenant QA/UAT/prod configmap in the workspace defines it, so in those environments the fallback publish has no destination configured (the deployed config may differ; check before relying on it).

### 23.2 Challenges (OTP) {#232-challenges-otp}

<a id="shared-4d54ef9f3716"></a>

`POST /v1/challenges` (app and biz) and `POST /v1/checkouts/challenges` (app only) create or validate a one-time-password challenge through the identity service (`IdentityOtpDataClient`). The purpose enum has two values: `GUEST_CHECKOUT` and `ADDRESS`. A context value is derived from purpose + profile id. If the request carries a `challengeId`, the existing challenge is validated; otherwise a new one is created. Fulfillment's app tier has a similar `/challenges` for address changes.

### 23.3 mycheckout periods (business-volume periods) {#233-mycheckout-periods-business-volume-periods}

<a id="shared-14a337289eb0"></a>

Stored in DynamoDB table `mycheckoutperiod…` (data tier), exposed as `/v1/mycheckout-periods` CRUD, list, items and search through app, biz and data. **On create checkout for POS or CSP channels**, the data tier searches the periods for the order date and sets the checkout's `orderPeriod` and `bonusPeriod` codes (`populatemycheckoutPeriods` in data-tier `CheckoutServiceImpl`). Other channels pass the periods in the request.

<a id="shared-b64082151de8"></a>

**Risk:** biz `mycheckoutPeriodsController` calls `.block()` inside a WebFlux controller. Reactor rejects blocking on Netty event-loop threads, so these endpoints may fail or tie up a thread; worth a test.

### 23.4 Tax documents {#234-tax-documents}

<a id="shared-9c8f6bb1b24d"></a>

`GET /v1/checkouts/{id}/tax-documents` (biz) returns the tax-invoice identities the customer can choose from: if the selected tax payer is a **corporation**, the stored tax document is returned; otherwise biz loads the account's profiles from the profile service and maps each to a tax document (VAT-registered flag, tax payer type, branch). Used for markets that issue full tax invoices with the buyer's tax identity (e.g. Thailand style).

### 23.5 Order cancellation jobs (unpaid and special orders) {#235-order-cancellation-jobs-unpaid-and-special-orders}

The order job service runs **five CronJobs per tenant** (THA prod values shown; other tenants similar), each `java -jar app.jar <jobType>`:

<a id="shared-34b080b96d6a"></a>

| CronJob | Schedule (UTC) | Job type |
|---|---|---|
| cancel web order, payment retry | `20,45 17 * * *` | `cancelweborderpaymentretry` |
| cancel web order, payment awaited | `5 17 * * *` | `cancelweborderpaymentawaited` |
| cancel auto-SOP order | `10 17 * * *` | `cancelautosoporder` |
| cancel month-end | `15 17,18 28-31 * *` | `cancelmonthend` |
| cancel random staff order | `20 17 * * *` | `cancelrandomstafforder` |

<a id="shared-6723e0bc7fc5"></a>

Flow: the job calls order data `POST /v1/jobs/cancel-orders` with its job type → data tier records a job row (`STARTED`), loads that job's search criteria from Postgres table `order_cancel_properties` (JSONB: limit, days offset/span, start/end time, exact/or/not/nested search filters) → searches **OpenSearch** for matching orders in the computed UTC window → writes one row per order into `orders.order_cancel_record` → marks the job `COMPLETED`. A **Postgres CDC connector** publishes each record to `cancelorder_raw_v1`; the consumer that actually cancels the order is outside this workspace (presumably the OMS side). Bulk cancel and bulk return use the same record tables.

This answers "what happens to orders stuck in `AWAITING_PAYMENT` / payment retry": they are cancelled by these jobs after the configured window.

### 23.6 Order domain at a glance {#236-order-domain-at-a-glance}

<a id="shared-bf08ae022cf1"></a>

Order app (Quarkus native) serves history, search, invoices, delivery tracking (consignments, packages, print status), cancellation (`PUT /v1/order-cancel`, manual release), returns (eligibility, create/update/complete/cancel, item conditions, images, return numbers, blocking returns) and replacements. Order data (Quarkus native) owns the OpenSearch read model (with admin endpoints for index mappings and templates), job tables and return/cancel state in Postgres. Order eventservice archives events to S3, re-publishes, and exposes a manual Kafka retry endpoint (`GET /v1/orders/kafkaRetry/{timestamp_ms}`). Operation lists: catalogue §3.

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
