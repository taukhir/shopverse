---
slug: /mycheckout/end-to-end-system/part-3
title: "mycheckout — NextGen Commerce: End-to-End System Guide — Part 3"
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

# mycheckout — NextGen Commerce: End-to-End System Guide — Part 3

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `END-TO-END-SYSTEM.md` |
| Source SHA256 | `4d1f4d3804f7dd242a206764ce0bbf48f087371f0c8bf643aa9ecd1038ae3228` |
| Guide part | 3 of 6 |

[Part 1](/mycheckout/end-to-end-system/part-1) · [Part 2](/mycheckout/end-to-end-system/part-2) · [Part 3](/mycheckout/end-to-end-system/part-3) · [Part 4](/mycheckout/end-to-end-system/part-4) · [Part 5](/mycheckout/end-to-end-system/part-5) · [Part 6](/mycheckout/end-to-end-system/part-6)

## 7. After place order: the event chain {#7-after-place-order-the-event-chain}

### 7.1 EOM adaptor (`comcheckoutes`) {#71-eom-adaptor-comcheckoutes}

<a id="shared-1cc4297bb1fe"></a>

Function bindings from `app-configs/configmap_jpn_qa.yml` **(config)**: `readCheckoutEvent`, `readSalesOrderPaymentsEvent`, `readCheckoutEventRlq`, `syncAddressBook`, `syncAddress`, `consumeAddressEvent`, `consumeShippingAddressEvent`, `consumeRegistrationEvent`.

`SalesOrderServiceImpl.createSalesOrder(CheckoutEvent)` **(code)**:

<a id="shared-4c79f74ae0ed"></a>

1. Decode the checkout list from the event (JSON, or compressed binary when `isBinary`). A group (GCO) checkout carries several checkouts.
2. Map each to a `SalesOrderEntity`. Enrichment calls product, promotion, checkout biz, fulfillment, contact, account and profile. Tax recalculation and EOM calculation checks are controlled by `calculate.taxation.service.support.enable`, `eom.calculations.validation.enable` and `price.calculation.strategy.override` (GROSS/NET).
3. Validate. Valid → `orderEventStatus=PUBLISHED`. Validation failure → `VALIDATION_FAILED` with reasons, and the entity is published to `salesorder-comcheckoutes-dlq_error_v1`. Unexpected error → `ERROR`.
4. Orders with more than `sales.order.dynamoDB.maxOrderLinesLimit` lines are stored as compressed binary with status `PUBLISHED_BINARY`, which the stream filter ignores, and are published manually to Kafka to avoid the 400 KB item limit and duplicates.
5. Save one entity, or all of a group in one transaction. TTL defaults to 3600 seconds (`sales.order.dynamoDB.ttlInSeconds`).
6. The `salesorder` table stream publishes to `salesorder_pub_v1` only for `PUBLISHED` or `REPUBLISHED` (`cdcType: LATEST`) **(config)**.

Errors on `readCheckoutEvent` send the checkout event to the RLQ. `ResourceAlreadyExistException` is treated as success (idempotent replay). See §18 for retry mechanics.

<a id="shared-37a26647ba88"></a>

The adaptor also exposes `checkout-eom-rest`: `POST /v1/salesorders`, `GET/PUT /v1/salesorders/{id}` (PUT sets `REPUBLISHED` and so republishes through CDC), and `POST /v1/updateRegistrationAddress`.

### 7.2 Consumers of `salesorder_pub_v1` {#72-consumers-of-salesorder_pub_v1}

<a id="shared-bb457ec2f6eb"></a>

| Consumer | What it does | Evidence |
|---|---|---|
| EOM / Enterprise Order Management | Order management and status updates | (external). Order eventservice docs say EOM publishes order events; this workspace does not show whether EOM writes back to the same topic or only consumes |
| `comfulfillmentes` | `ORDER_READY_FOR_FULFILLMENT` (or POS `ORDER_COMPLETE`) → `ON_HAND_ADJUSTMENT`; `ORDER_CANCELLED` → `RELEASE` on the NEXTGEN ledger | (docs) `FULFILLMENT-END-TO-END.md` §14.6; (config) bindings |
| `comorderes` | Batch consumer `consumeOrderEventFromKafka`: validate, store every event in S3 `…-order-return-events` and the latest per order in `…-order-return-latest-event`, re-route to `salesorderhistory_pub_v1`, DLQ or RLQ; also invokes a Lambda (`createInventoryReport…`) | (code) `EomEventListener`, (config) |

<a id="shared-4a33074d5aa8"></a>

`comorderes` consumes the matching return topics from the `valuechain_` namespace (`salesreturnorder_pub_v1`, `salesreturnorderhistory_pub_v1`). How OpenSearch in `comorderds` is filled is not in this workspace; the order-api repo lists `commerce-indexedorder-commandservice` as a child service **(external)**.

### 7.3 Inventory-availability loop {#73-inventory-availability-loop}

<a id="shared-6f3385437b30"></a>

Each stock-ledger change in fulfillment flows through Postgres CDC (`stocklevel_raw_v1`) back into fulfillment eventservice, which publishes `inventory-availability_pub_v1` when disposition, date or status changes. Product and search consume it **(docs)** `FULFILLMENT-END-TO-END.md` §4.4.

---

## 8. Business rules reference {#8-business-rules-reference}

These rules are spread across handlers, strategies and services. They are collected here with the class that enforces each one **(code)** unless marked otherwise.

### 8.1 Classifications {#81-classifications}

<a id="shared-7df32d65cc2d"></a>

A checkout carries a list of `Classification` values (contract `checkout-biz-rest`): `NORMAL`, `GROUP`, `GCO`, `SOP`, `PROXY`, `REGISTRATION`, `RENEWAL`, `BOOKING`, `UPGRADE`, `DOWNGRADE`, `DIGITAL`, `WHT`, `REPLACEMENT`, `AMC`, `SERVICE`, `REWARD`, `CUSTOMER_SERVICE`, `RANDOM_STAFF`, `NO_CHARGE`, `PREORDER`. These are the classifications that change behaviour in the code read for this guide:

<a id="shared-e22b112cff41"></a>

| Classification | Rule | Where |
|---|---|---|
| `GCO` / `GROUP` | Group checkout: one parent plus child checkouts. Reservation uses `createReservationForGco`. Metrics use the group total. The data tier stores all children in one or more DynamoDB rows written in a transaction | `DefaultNormalPlaceOrderStrategy`, `CheckoutPlaceOrderStepHandler.recordMetrics`, data `CheckoutServiceImpl` |
| `NO_CHARGE` | Order total must be exactly zero, otherwise `NoChargeOrderException` | `CheckoutPlaceOrderStepHandler.validate` |
| `WHT` | Never routed to the POS place-order strategy even when the client is POS | `PlaceOrderStrategyFactory` |
| `PREORDER` | Japan: preorder reservation via the Hybris preorder app (`PreOrderHandler`, `PreOrderReserveHandler`); most enrichment and reservation handlers excluded by `handlerconfig` for `ngc_web` and `jpn_gem` | handler classes, master data |
| `BOOKING` | Japan room booking: no delivery fee, fulfillment, slot or inventory validation, promotions, rationing or reservation; no checkout-profile update | in-handler `isBookingChannel()` guards; `disableCheckoutProfileUpdate` |
| `DIGITAL` | No checkout-profile update | `CheckoutPlaceOrderStepHandler` |
| `RENEWAL`, `UPGRADE`, `DOWNGRADE` | On first order, account lifecycle (`renewalLifecycle` / `businessNatureLifeCycle`) set to `PROCESSING` | `updateAccountProcessLifeCycleOrder` |
| `REGISTRATION` (account process) | Registration patched to `PAYMENT_INITIATED`; shipping address created for the new account; dummy cart not deleted | `updateAccountProcessCheckoutStatus`, `createAddressForRegistration`, `canDeleteCart` |
| `SOP` | Subscription order; AUTO_SOP reservation needs `checkout.subscription.reservation.enable`; SYSTEM-channel carts are not deleted | `InventoryReservationServiceImpl` (docs), `canDeleteCart` |

### 8.2 Channels and clients {#82-channels-and-clients}

`mycheckoutChannel` is `MOBILE`, `WEB`, `POS`, `SYSTEM`, `DEFAULT` or `CSP`.

<a id="shared-5f71524de36e"></a>

- POS behaviour is decided by `clientName` through `checkoutUtil.isPosStrategyApplicable`, not by the channel header.
- Japan POS orders keep their cart.
- `SYSTEM` is used for auto-SOP.
- The client id (`ngc_web`, `jpn_gem` and so on) feeds `handlerconfig` exclusions and the payment-failure modification choice.

### 8.3 Payment result rules (internal-handler path) {#83-payment-result-rules-internal-handler-path}

`PaymentServiceImpl.handlePaymentResult` **(code)**:

<a id="shared-14c49b52640c"></a>

| Payment status | Checkout status | Side effects |
|---|---|---|
| `AUTHORIZED`, `AWAITED`, `CAPTURED` | `ORDER_CREATED` | Reservation details populated; earned points calculated |
| `INITIATED` | `AWAITING_PAYMENT` | Wait for `salesorderpayments_pub_v1` (§6.6) |
| `AUTHORIZE_FAILED`, `INITIATED_FAILED`, `ABORTED`, or no status | unchanged, or reset to `CREATED` | Selected payments moved to history; reservations deleted (errors swallowed); loyalty points refunded; adjustments cleared; payment-failure modification added (auth-failure variant for clients other than `ngc_web`) |
| No payment response at all | unchanged | Same failure handling when reservations exist; otherwise only a modification |
| Failure while `AWAITING_PAYMENT` | reset to `CREATED` | Runs `PLACE_ORDER_NORMAL_CHECKOUT_FAILED` (full recalculation, then UPDATE_DB) |

<a id="shared-db1ae2f03c56"></a>

Japan exception: if the loyalty-points payment itself failed (`totalAmpointsAdjusted` set and no real loyalty transaction reference), the failure handling is skipped (`shouldSkipPaymentFailureHandling`).

### 8.4 Cart deletion {#84-cart-deletion}

The cart is deleted asynchronously only when all of these hold (`canDeleteCart`):

<a id="shared-4ae18abb764c"></a>

- The checkout moved from `CREATED` or `AWAITING_PAYMENT` to `ORDER_CREATED` or `PAYMENT_REQUIRED`.
- It is not a Japan POS order.
- The channel is not `SYSTEM`.
- The cart is not an account-process or registration dummy cart, meaning its `parentCartId` contains the profile id or guest guid.

### 8.5 Modifications instead of errors {#85-modifications-instead-of-errors}

<a id="shared-3e18bb768ccc"></a>

Most business failures do not return an HTTP error. They return the checkout with `modification` or `modifications` set, and place order then stops before the PLACE_ORDER handler executes (`hasNoErrors`). Codes from the contract:

<a id="shared-16303b80b420"></a>

- **Promotions:** `DISCOUNT_PROMOTION`, `NEW_PROMOTION_AVAILABLE`, `PROMOTION_EXPIRY`, `PWP_EXPIRY`, `GWP_EXPIRY`, `GWP_OUT_OF_STOCK`, `PROMOTION_DATA_NOT_AVAILABLE`
- **Payment:** `PAYMENT_FAILED`, `PAYMENT_FAILED_NONFATAL`
- **Stock:** `OUT_OF_STOCK`, `BOPIS_OUT_OF_STOCK`, `BACK_ORDER`
- **Restrictions and blocks:** `RATIONING_RULE_FAILED`, `ACCOUNT_BLOCK`, `ORDERING_BLOCK`, `PROXY_ORDERING_BLOCK`, `PURCHASE_RESTRICTION`, `FULFILLMENT_RESTRICTION`, `PICKUP_RESTRICTION`, `DELIVERY_RESTRICTION`, `COLLECTION_CENTER_RESTRICTION`
- **Other:** `BILLING_ADDRESS_MISSING_INVALID`, `LATE_RENEWAL`, `ORDER_VALUE_CHANGE`, `PRODUCT_INFO_MISSING`

Clients must read the response body, not just the HTTP status.

### 8.6 Order id {#86-order-id}

<a id="shared-20e0ae9b9c40"></a>

The order id is `<countryCode><separator><counter formatted with orderIdFormat>`. The counter is a DynamoDB atomic counter in table `ordersequence`, one item per country, and `orderIdFormat` comes from `config` master data (`OrderSequenceServiceImpl`, `OrderSequenceEntity`).

---

## 9. API behaviour {#9-api-behaviour}

### 9.1 Endpoint map {#91-endpoint-map}

<a id="shared-59e067c15d1e"></a>

App tier paths are `/comcheckoutas/...`, biz tier paths are `/comcheckoutbs/...` with the same shape. The OPA scope comes from `commerce-checkout-appservice/policies-as-code/src/data.json`. "Anon OK" means the sidecar policy also accepts any request carrying an `x-amw-anon-id` header.

<a id="shared-92470b8c36f5"></a>

| Method and path | Operation | Biz flow | Scope | Anon OK | Persists |
|---|---|---|---|---|---|
| `POST /v1/checkouts` | createCheckout | `CREATE_CHECKOUT` | `checkout:checkout:write` | yes | create (idempotent, §9.2) |
| `GET /v1/checkouts?…` | getCheckoutByOrderId | read via `OrderIdIndex` | `checkout:checkout:read` | yes | no |
| `GET /v1/checkouts/{id}` | getCheckoutByCheckoutId | `GET_CHECKOUT` (recalculates) | `checkout:checkout:read` | yes | no |
| `PATCH /v1/checkouts/{id}` | updateCheckout | `UPDATE_CHECKOUT` | `checkout:checkout:write` | yes | update |
| `PATCH /v1/checkouts/{id}/child-checkout/{childId}` | updateChildCheckout | — | `checkout:checkout:write` | no | update |
| `POST /v1/checkouts/{id}/fulfillments` | addFulfillmentInformation | `ADD_FULFILLMENT` | `checkout:fulfillment:write` | yes | update |
| `GET /v1/checkouts/{id}/fulfillments` | getFulfillmentOptions | allocation | `checkout:fulfillment:read` | yes | no |
| `PATCH /v1/checkouts/{id}/fulfillments/{fid}` | updateFulfillmentInfo | `UPDATE_FULFILLMENT` | `checkout:fulfillment:write` | yes | update |
| `PATCH /v1/checkouts/{id}/loyalty-points` | updateLoyaltyPoints | `UPDATE_AMPOINTS` | `checkout:loyalty:write` | yes | update |
| `POST /v1/checkouts/{id}/payments` | addPaymentOptionsData | `UPDATE_PAYMENT_*` | `checkout:payment:write` | yes | update |
| `PUT /v1/checkouts/{id}/payments/{pid}` | updatePaymentOptionsData | `UPDATE_PAYMENT_*` | `checkout:payment:write` | yes | update |
| `POST /v1/checkouts/{id}/place-order` | placeOrder | `PLACE_ORDER_*` | `checkout:checkout:placeorder` | yes | update, triggers CDC |
| `GET /v1/checkouts/{id}/validate` | validateCheckout | validation | `checkout:checkout:read` | yes | no |
| `GET /v1/checkouts/{id}/tax-documents` | getAllTaxDocuments | — | `checkout:taxdocument:read` | yes | no |
| `POST /v1/orders` | createOrder | `CREATE_ORDER` | `checkout:checkout:write` | yes | create, triggers CDC |
| `/v1/profiles` | checkout profile CRUD | — | `checkout:profile:*` | GET only | profile table |
| `/v1/addresses…` | address CRUD | — | `checkout:address:*` | no | PostgreSQL per market |
| `/v1/mycheckout-periods…` | mycheckout period CRUD and search | — | `checkout:mycheckoutperiod:*` (`scope_required`) | no | DynamoDB |
| `POST /v1/challenges`, `POST /v1/checkouts/challenges` | OTP challenge | — | `checkout:challenge:write` / `checkout:checkout:write` | yes | no |
| `/v1/preorder…` (app tier only) | preorder list, validate, cancel | — | not in data.json | — | Hybris |

The EOM adaptor exposes `POST /v1/salesorders`, `GET/PUT /v1/salesorders/{id}`, `POST /v1/updateRegistrationAddress` and `POST /update-consumer-binding`.

### 9.2 Idempotency and concurrency {#92-idempotency-and-concurrency}

<a id="shared-10c3d9897fab"></a>

- **Create is idempotent by idempotency key.** The data tier derives the checkout id from the `X-Idempotency-Key` tuple (`defaultUuidGenerator.generateUUID(idempotencyKey)`) and writes with `attribute_not_exists(Id) AND attribute_not_exists(ChildId)`. A retry with the same key returns the existing checkout instead of creating a second one. Biz propagates `X-Idempotency-Key` and `X-AMW-ANON-ID` downstream (`nx.framework.internal.api.propagate.additional-headers`).
- **Updates use optimistic locking.** `CheckoutEntity.version` is a DynamoDB `@DynamoDbVersionAttribute`. Every update and place-order request must send the current `version`. On a mismatch the data tier throws `ResourceVersionMismatchException`.
- **One deliberate override:** if the stored checkout is `CREATED` and the incoming one is `ORDER_CREATED`, the data tier takes the stored version and writes anyway (`handleVersionMismatch`, `forceUpdateCheckout`). This protects a successful place order from losing to a concurrent edit. In every other case the stored checkout is returned unchanged.
- **Repeated calls in quick succession.** Handlers are skipped while the checkout's `lastUpdatedAt` is within `skip-step.timeout.seconds` (§5.2). This dampens repeated recalculation, but it also means a retry within that window does less work.
- **Sales orders** are idempotent on replay: `ResourceAlreadyExistException` is treated as success.

### 9.3 Errors and timeouts {#93-errors-and-timeouts}

<a id="shared-929e05753d74"></a>

| Situation | Behaviour |
|---|---|
| Business rule failed | HTTP 200 with `modification(s)` (§8.5) |
| Version mismatch | `ResourceVersionMismatchException` from the data tier. The HTTP status is set by the global handler, which was not traced |
| OPA denies (app tier) | `ForbiddenException` (403) |
| Guest checkout disabled for the market | `GuestCheckoutException` |
| Downstream slow | Per-client timeouts: payment 15 s, product 1.5 s, fulfillment 2–3 s, loyalty 3.5 s, most others 1–2 s. The mesh SLA timeout for biz is 22 s (`defaultSLADetails.timeout`) **(config)** |
| Fulfillment reservation conflict | HTTP 409 from fulfillment, mapped to an out-of-stock modification (fulfillment docs §14.3) |
| Pickup point gone | HTTP 410 from fulfillment, mapped to a pickup modification |

---

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
