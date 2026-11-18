---
slug: /mycheckout/api-and-event-catalog
title: "mycheckout — API and Event Catalogue (all domains)"
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

# mycheckout — API and Event Catalogue (all domains)

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `API-AND-EVENT-CATALOG.md` |
| Source SHA256 | `d70fcd17613ce6937556a6d2ea3e04dcec38b92cf18cb0e0bdda107d6da24606` |
| Guide part | 1 of 1 |

## API and Event Catalogue (all domains) {#api-and-event-catalogue-all-domains}

<a id="shared-b4ab0250124c"></a>

Generated 2026-11-04 from the OpenAPI and AsyncAPI contracts in each domain's `-api` repo, plus the Kafka topic names found in each service's configmaps. This is the **complete list of operations** the contracts declare. Behaviour for each operation is described in `END-TO-END-SYSTEM.md` (checkout), `fulfillment/docs/` (fulfillment) or is marked as not yet traced in `COVERAGE-AUDIT.md`.

<a id="shared-0d865171eaf7"></a>

Conventions: paths are relative to the service base path (for example `/comcheckoutas`). Topic names drop the `commerce_<env>_<tenantCode>_` prefix. Operation counts are distinct method + path pairs across all versions of a contract.

---

## 1. Checkout (`commerce-checkout-api`) {#1-checkout-commerce-checkout-api}

### 1.1 `checkout-app-rest` (app tier, 35 operations) and `checkout-biz-rest` (biz tier, 31) {#11-checkout-app-rest-app-tier-35-operations-and-checkout-biz-rest-biz-tier-31}

<a id="shared-da6e3e042b7f"></a>

| Resource | Methods (app) | In biz? | Notes |
|---|---|---|---|
| `/v1/checkouts` | GET, POST | yes | Create checkout; GET lists by query (e.g. by order id) |
| `/v1/checkouts/{checkoutId}` | GET, PATCH | yes | Read (recalculates) and update |
| `/v1/checkouts/{checkoutId}/child-checkout/{childId}` | PATCH | yes | Update one child of a group checkout |
| `/v1/checkouts/{checkoutId}/fulfillments` | GET, POST | yes | Delivery/pickup options |
| `/v1/checkouts/{checkoutId}/fulfillments/{fulfillmentId}` | PATCH | yes | Change the selected fulfillment |
| `/v1/checkouts/{checkoutId}/loyalty-points` | PATCH | yes | Apply loyalty points |
| `/v1/checkouts/{checkoutId}/payments` | POST | yes | Add payment option |
| `/v1/checkouts/{checkoutId}/payments/{paymentOptionId}` | PUT | yes | Replace payment option |
| `/v1/checkouts/{checkoutId}/place-order` | POST | yes | Place order (§6 of the end-to-end guide) |
| `/v1/checkouts/{checkoutId}/validate` | GET | yes | Field validation |
| `/v1/checkouts/{checkoutId}/tax-documents` | GET | yes | Tax documents for the checkout |
| `/v1/checkouts/challenges` | POST | **app only** | Challenge for a checkout (likely OTP; biz has OTP and identity clients) |
| `/v1/challenges` | POST | yes | Challenge (likely OTP) |
| `/v1/orders` | POST | yes | One-shot order creation |
| `/v1/addresses`, `/v1/addresses/{id}` | GET, POST, PUT, DELETE | yes | Address book (PostgreSQL per market) |
| `/v1/mycheckout-periods`, `/{id}`, `-list`, `/items`, `/search` | GET, POST, PUT | yes | Business-volume periods (month-end calendar) |
| `/v1/profiles` | GET, POST, PUT | yes (`/{profileId}`) | Checkout profile (saved preferences) |
| `/v1/preorder`, `/v1/preorder/{eventId}/validate`, `/v1/preorder/{preorderId}/cancelReservation` | GET, POST | **app only** | Preorder (Japan) |

### 1.2 `checkout-data-rest` (data tier, 25 operations) {#12-checkout-data-rest-data-tier-25-operations}

<a id="shared-b2787c2c6513"></a>

`/v1/checkouts` (GET, POST), `/{checkoutId}` (GET, **PUT**), `/fulfillments` (POST), `/fulfillments/{id}` (PATCH), `/payments` (POST), `/payments/{id}` (PUT), `/place-order` (POST); `/v1/addresses` CRUD; `/v1/mycheckout-periods` (same set as biz); `/v1/profiles` (POST) and `/{id}` (GET, PUT, DELETE).

### 1.3 `checkout-eom-rest` (EOM adaptor, 4 operations) {#13-checkout-eom-rest-eom-adaptor-4-operations}

`POST /v1/salesorders`, `GET /v1/salesorders/{salesOrderId}`, `PUT /v1/salesorders/{salesOrderId}` (republish), `POST /v1/updateRegistrationAddress`.

### 1.4 Events {#14-events}

<a id="shared-8b047308f5df"></a>

| Contract | Topic |
|---|---|
| `checkout-internal-event` | `checkout_raw_v1` |
| `checkout-event` | `salesorder_pub_v1` |
| `address-internal-event` | `address_raw_v1`, `address_raw_v2` (deployed config uses `addresses_raw_v1`) |
| `address-backoffice` | Address back-office contract (no paths found by the parser) |
| *(config only)* | `loyaltybalancerecon_pub_v1` named in checkout **biz** configmap (not in any contract; see audit) |

---

## 2. Fulfillment (`commerce-fulfillment-api`) {#2-fulfillment-commerce-fulfillment-api}

Behaviour: `fulfillment/docs/FULFILLMENT-API-CATALOG.md` and `FULFILLMENT-END-TO-END.md`.

### 2.1 `fulfillment-app-rest` (37 operations) {#21-fulfillment-app-rest-37-operations}

<a id="shared-9552fcda2ffe"></a>

| Resource | Methods |
|---|---|
| `/fulfillment-types` | GET |
| `/service-locations`, `/{serviceLocationId}` | GET |
| `/cart-pickup-locations` | POST |
| `/delivery-fees` | POST |
| `/service-fees`, `/{serviceFeeId}` | GET, POST, PUT, DELETE |
| `/delivery-dates`, `/{id}` | POST, GET, PUT, DELETE |
| `/delivery-slots/availability` | GET |
| `/postalcode-serviceabilities`, `/{id}` | GET, POST, PUT, DELETE |
| `/postalcodes`, `/states`, `/districts`, `/subdistricts`, `/daneCodes` | GET (address reference data; DANE = Colombian location codes) |
| `/shipping-addresses`, `/{id}` | GET, POST, PUT, DELETE |
| `/stock-levels`, `/batch`, `/detail`, `/audit` | GET, POST |
| `/warehouses` | GET |
| `/challenges` | POST (identity OTP challenge, per fulfillment docs) |

### 2.2 `fulfillment-data-rest` (49 operations) {#22-fulfillment-data-rest-49-operations}

<a id="shared-ff609655641a"></a>

Adds to the app list: `/allocations` (POST), `/reservations` (POST) and `/{reservationId}` (DELETE), `/commands` and `/{commandId}` (GET, POST: location loaders), `/fulfillment-types/{id}` (GET, POST, PUT, PATCH, DELETE), `/service-locations` (POST, DELETE) and `/{id}` (PUT, DELETE), `/service-locations/{id}/pickup-availability` and `/pickup-reservations` (POST), `/pickup-location-checks/{checkKey}` (GET, PUT: Redis token), `/post-locations` and `/{postLocationId}` (CRUD).

### 2.3 Events {#23-events}

<a id="shared-2be1cb796491"></a>

`inventory-availability_pub_v1` (out), `stocklevel_raw_v1` (CDC in), `shippingaddress_raw_v1`. Config also binds AS400 `imsjapan_<env>_global_inventorycdm_pub_v1` (Protobuf), `salesorder_pub_v1`, and retry/dead-letter topics for stock level, sales order and the inventory feed.

---

## 3. Order (`commerce-order-api-main`) {#3-order-commerce-order-api-main}

### 3.1 `order-app-rest` (46 operations) {#31-order-app-rest-46-operations}

<a id="shared-aaee1988719e"></a>

| Area | Operations |
|---|---|
| Order history | `GET /v1/orders`, `GET /v1/orders/{orderId}`, `POST /v1/orders/search`, `POST /v1/orders/search/superapp`, `GET /v1/order-confirm/{orderId}`, `GET /v1/orders/{orderId}/events/latest`, `POST /v1/orders/publish` |
| Tracking | `GET /v1/orders/track-delivery`, `GET /v1/orders/anonymous-track-delivery`, `GET /v1/orders/{orderId}/consignments`, `GET …/consignments/{consignmentId}/track-delivery`, `GET /v1/orders/{orderId}/packages`, `POST …/packages/{packageId}/manage`, `POST /v1/packages/printStatus`, `POST /v1/packages/getPrintStatus` |
| Invoices | `GET /v1/orders/invoices` |
| Cancellation | `PUT /v1/order-cancel`, `POST /v1/orders/{orderId}/manual-release` |
| Returns | `GET /v1/return-eligible-items/{orderId}`, `POST/PUT /v1/orders/returns`, `POST /v1/orders/returns/complete`, `POST /v1/orders/returns/search`, `GET /v1/orders/returns`, `GET /v1/orders/returns/{returnId}`, `GET /v1/returns/{returnId}`, `GET /v1/returns/{returnId}/events/latest`, `PUT /v1/return-cancel`, `GET /v1/returns/return-numbers`, `GET /v1/returns/item-conditions`, `POST /v1/returns/publish`, `GET /v1/orders/{orderId}/returns-exchanges` |
| Return blocking | `GET/POST/DELETE /v1/orders/{orderId}/block-return` |
| Replacements | `GET /v1/replacement-eligible-items/{orderId}`, `POST/PUT /v1/orders/replacements`, `GET /v1/replacement/{replacementId}` |
| Return images | `POST /v1/images/upload`, `/retrieve`, `/delete` |
| Reference / reports | `GET /v1/reasons`, `GET /v1/next-numbers`, `POST /v1/reports/orders/search`, `POST /v1/reports/orders/returns/search` |

### 3.2 `order-data-rest` (29 operations) {#32-order-data-rest-29-operations}

<a id="shared-a049c1e94cf7"></a>

Orders: `POST/GET /v1/orders`, `GET/DELETE /v1/orders/{orderId}`, `POST /v1/orders/search`, `/search/superapp`, `/search/smartdashboard`, `POST /v1/orders/validateSerialNumbers`, block-return (GET, POST, DELETE). Returns: `POST/GET/PATCH /v1/orders/returns`, `GET/DELETE /v1/orders/returns/{returnId}`, `POST /v1/orders/returns/search`. Jobs: `POST /v1/jobs/bulk-cancel`, `/bulk-return`, `/cancel-orders`, `/cancel-order-failed`. OpenSearch admin: `GET/POST /v1/opensearch/mapping`, `GET/PUT /v1/opensearch/template` and the same for `/return/`.

### 3.3 `order-event-rest` (order eventservice, 5 operations) {#33-order-event-rest-order-eventservice-5-operations}

<a id="shared-a46c3019c9c4"></a>

`POST /v1/orders/publish`, `POST /v1/returns/publish`, `GET /v1/orders/{orderId}/events/latest`, `GET /v1/returns/{returnId}/events/latest`, `GET /v1/orders/kafkaRetry/{timestamp_ms}`.

### 3.4 Events {#34-events}

<a id="shared-393d45a4b25f"></a>

`cancelorder_raw_v1`, `returnorder_raw_v1` (CDC contracts). Order eventservice binds `salesorder_pub_v1`, `salesorderhistory_pub_v1`, `salesorderpayments_pub_v1`, `salesreturnorder_pub_v1`, `salesreturnorderhistory_pub_v1` and S3 retry/dead-letter topics for orders and returns.

### 3.5 Jobs (order jobservice CronJobs, from Helm values) {#35-jobs-order-jobservice-cronjobs-from-helm-values}

**Update:** there are five jobs per tenant (payment-retry, payment-awaited, auto-SOP, month-end and random-staff order cancellation). Traced in the end-to-end guide §23.5.

---

## 4. Taxation (`commerce-tax-api`) {#4-taxation-commerce-tax-api}

<a id="shared-620d93388450"></a>

| Contract | Operations |
|---|---|
| `tax-data-rest` (21, the `comtaxds` contract) | `POST /v1/tax/calculate`; CRUD on `/v1/tax-details`, `/v1/tax-exclusion-cities`, `/v1/tax-exclusion-products`, `/v1/tax-exclusion-states` |
| `taxation-data-rest` (14, `comtaxationds`) | `POST /v1/tax-calculations`; CRUD on `/v1/tax-details`, `/v1/tax-group-detail-mapping`; rule engine reference data `GET /v1/conditions`, `/v1/conditions/{key}`, `/v1/actions` |
| `tax-event` | AsyncAPI file is the unmodified sample template (streetlights); no real tax events |
| `taxconfig`, `feature-flags` | Master data schema and flags |

---

## 5. Product (`commerce-product-api-main`) {#5-product-commerce-product-api-main}

<a id="shared-4879455f5811"></a>

| Contract | Operations (summary) |
|---|---|
| `product-app-rest` (17) | Products (`/v1/products`, `/{id}`, items, PCM metadata), categories, `GET /v2/inventories/{itemNumber}`, status management, `/v1/items/{item-id}/preorder`, `/v1/product-setups`, CMS `POST /v1/cms/{contentModelLabel}/fetch-entries` |
| `product-biz-rest` (12) | `POST /v1/products/fetch` (used by checkout), products, product setups, status, categories, bundles (`/derive-availability`, `/prices`, `/validate`, `/v1/validation/bundles`), `POST /v1/prices/timeline` |
| `product-data-rest` (32) | v1/v2 products CRUD and upload, channel availabilities, tags, variant groups, bundle products and availabilities per location, product items |
| `product-catalog-app-rest` / `-biz-rest` (2 each) | `GET /v1/catalogs/{country}-{vertical}/products` and `/bundleproducts` |
| `item-data-rest` (16) | v1/v2 items, uploads, channel availabilities per item |
| `price-data-rest` (21) | v1/v2 prices, price timelines, price adjustments (batch upsert/delete, excluded, fetch, state-sync, timeline) |
| `inventory-data-rest` (12) | v1/v2 inventories (product-side inventory, separate from the fulfillment ledger) |
| `category-app-rest` (11) / `category-data-rest` (17) | Categories, children, associations, PCM metadata, uploads |
| `bundle-data-rest` (6) | Product bundles CRUD and upload |
| `product-associatedentity-data-rest` (9) | Associated entities and associations |
| `usersegment-data-rest` (4) | User segments |
| `preorder-app-rest` / `-biz-rest` / `-data-rest` (1/1/4) | Preorder events sync, fetch items, read/update |
| `delayed-event-rest` (6) | Delayed (scheduled) events CRUD and fetch |
| `command-data-rest` (4) | Commands and executions |
| `product-publish-rest` (1) | `GET /delayed-events/process` |

<a id="shared-739e41c1492d"></a>

Product topics: `product_raw_v1/v2`, `item_raw_v1/v2`, `price_raw_v1/v2`, `price_pub_v1`, `priceadjustment_raw_v1`, `inventory_raw_v1`, `rollupinventory_raw_v1`, `inventory_public_event_pub_v1`, `category_raw_v1`, `categoryv2_raw_v1`, `categoryq_raw_v1`, `categoryqassoc_raw_v1`, `channelavailability_raw_v1`, `productchannelavailability_raw_v1`, `classifier_raw_v1`, `assocentity_raw_v1`, `tag_raw_v1`, `tagassociation_raw_v1`, `bundle_raw_v1`, `bundle-avail-calc_raw_v1`, `bundle-price-event_raw_v1`, `product-ca-event_raw_v1`, `product-tuples_raw_v1` (+ DLQ), `product-searchindexupdate_raw_v1`, `product_pub_v1`, `product-user-notification_pub_v1`, and an SQS queue for PCM events.

---

## 6. CSP (`commerce-csp-api-main`) {#6-csp-commerce-csp-api-main}

<a id="shared-eb77b98dc0ce"></a>

`csp-app-rest` (16) / `csp-data-rest` (15): Do-Not-Disturb records (`/v1/dnds`, `/{dndId}`: GET, POST, PATCH), upsell playbooks (`/v1/upsell-playbooks`: GET, POST, PATCH, DELETE), playbook actions (`/v1/upsell-playbook-actions`: GET, POST, DELETE, plus `/export` in the app tier), and call-router keys (`/v1/routerCallKey`: GET, POST). `csp-event` is the unmodified AsyncAPI sample template.

---

## 7. Cart {#7-cart}

No cart contract repo is in the workspace (only app, biz, data and web components). Cart behaviour is summarised in the end-to-end guide §12.1.

---

## 8. Scheduled jobs (all CronJobs found in Helm values) {#8-scheduled-jobs-all-cronjobs-found-in-helm-values}

<a id="shared-8c0ae33ba56b"></a>

| Service | Schedules |
|---|---|
| `commerce-checkout-jobservice` | `0 * * * *` in global dev/qa (empty scaffold) |
| `commerce-fulfillment-jobservice` | Every 15 min in dev, Japan and Thailand QA; daily per country in LATAM (06:00, 08:00/10:00, 03:10 UTC) and Thailand UAT/prod (18:00 UTC) — location loaders |
| `commerce-order-jobservice` | Five cancellation jobs per tenant (see §3.5 and end-to-end guide §23.5) |

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
