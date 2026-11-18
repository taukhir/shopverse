---
slug: /mycheckout/coverage-audit
title: "mycheckout — Documentation Coverage Audit"
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

# mycheckout — Documentation Coverage Audit

**Historical source notes.** Fix claims and observations retain their original dates; they have not been reverified against current runtime behavior.

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `COVERAGE-AUDIT.md` |
| Source SHA256 | `46dbba1d55c086a0f7ab3c29aa5602a9dd11fee2771cf233b6471eb865401172` |
| Guide part | 1 of 1 |

## Documentation Coverage Audit {#documentation-coverage-audit}

<a id="shared-e958be11ae1d"></a>

Audit date: 2026-11-04. Scope: everything in `D:\BE Projects\checkout`, checked against `docs/END-TO-END-SYSTEM.md` (E2E), `docs/INTERVIEW-PREP.md` (IP), the fulfillment docs, and the new `docs/API-AND-EVENT-CATALOG.md` (CAT).

<a id="shared-d3096dc5b71a"></a>

**Method.** Listed every repo; parsed every OpenAPI/AsyncAPI contract in the six `-api` repos (about 600 operations); extracted every Kafka topic from service configmaps; listed CronJobs from Helm values and downstream service clients from the checkout biz configmap. Then searched the docs for each name.

<a id="shared-67fb6e6efe2f"></a>

**Status key.** **Covered**: behaviour explained. **Listed**: named in CAT or a table, behaviour not explained. **Thin**: mentioned in passing. **Missing**: nowhere in the docs. **Elsewhere**: covered by `fulfillment/docs/`.

---

## 1. Summary {#1-summary}

<a id="shared-9426958983c8"></a>

| Area | Before this audit | Now | What is still open |
|---|---|---|---|
| Checkout core flow (create → place order → hand-off) | Covered | Covered | — |
| Checkout secondary APIs (mycheckout periods, challenges, tax documents, child checkout, profiles, addresses, preorder, validate) | Thin / Missing | **Covered**: mycheckout periods, challenges, tax documents (E2E §23.2–23.4). **Listed**: the rest | Child checkout, profiles API, addresses API, preorder |
| Checkout downstream services (25 clients) | Thin (names in prose) | Thin | A table: service → handler → timeout → failure behaviour |
| Topic `loyaltybalancerecon_pub_v1` (named in checkout biz config) | **Missing** | **Covered** (E2E §23.1) | Consumer is outside the workspace |
| Fulfillment APIs, jobs, Redis, ledger | Elsewhere | Elsewhere + Listed | — |
| Order domain (46 app, 29 data, 5 event operations; 5 cancellation CronJobs) | Thin (one paragraph) | **Covered**: cancellation jobs, overview (E2E §23.5–23.6). **Listed**: all operations | Returns, tracking and replacements in depth |
| Product domain (~200 operations, ~30 topics) | Thin | **Listed** in CAT §5 | Price timeline/adjustments, delayed events, preorder events, catalogue |
| Taxation (two contracts: `comtaxds`, `comtaxationds`) | Thin | **Listed** in CAT §4 | Which one each market uses; rule engine (conditions/actions) |
| CSP | Thin | **Listed** in CAT §6 | — (not on the order path) |
| Cart | Thin | Thin | No contract repo in workspace; cart pricing pipeline not traced |
| Web components (checkout, cart, CSP, fulfillment) | Missing | Missing | UI flows, which APIs each component calls |
| Mock service, `fulfillment-api-tests`, Postman collections | Thin | Thin | How to run end-to-end tests locally |
| `docs/` extras (`Japan_Commerce_Order_Flow_Guide.docx`, `checkout.docx`, `Complete Flowc.txt`, `transaction type.txt`) | Missing | Missing | Read and reconcile with E2E |
| Interview doc | Checkout-centric | Section I added (unpaid-order cancellation, loyalty refund, OTP, mycheckout periods, tax invoices, doc audit); Quarkus list corrected | Returns and product/pricing questions |

---

## 2. Detailed gaps {#2-detailed-gaps}

### 2.1 Checkout {#21-checkout}

<a id="shared-3772553b5b39"></a>

| Item | Where it lives | Status | Note |
|---|---|---|---|
| `GET/POST/PUT /v1/mycheckout-periods*` (7 operations) | app, biz, data; DynamoDB `mycheckoutperiod` table | Listed | Business-volume period calendar; likely tied to month-end. Explain who calls it and how checkout uses the period |
| `POST /v1/challenges`, `POST /v1/checkouts/challenges` | app (both), biz (first) | Listed | Biz has OTP (`comotpds`) and identity (`comidentityds`) clients; confirm it is OTP |
| `GET /v1/checkouts/{id}/tax-documents` | app, biz | Listed | Japan invoice / tax documents? Not traced |
| `PATCH /v1/checkouts/{id}/child-checkout/{childId}` | app, biz | Thin | Group (GCO) checkouts are mentioned; child update flow is not |
| `/v1/profiles` | app, biz, data; `checkoutprofile` table | Thin | Profile update after order is covered (E2E §6.4); the API is not |
| `/v1/addresses` + `address-backoffice` contract | app, biz, data; Postgres | Thin | CDC to `addresses_raw_v1` is in CAT; API rules not covered |
| `/v1/preorder*` (app only) | app | Thin | Japan preorder via Hybris; flow not traced |
| `loyaltybalancerecon_pub_v1` | biz configmap | **Covered** (E2E §23.1) | Producer binding only in global dev/perf configmaps |
| DLQs `address-`, `addressmdms-`, `registration-comcheckoutes-dlq_error_v1` | EOM adaptor config | Listed | Retry semantics for address/registration consumers |
| Downstream clients: account, account search, blocks/privileges, cart, contact, fulfillment, identity, LOS, loyalty, OTP, payment, product, profile, promotion (biz + data), rationing, registration, restrictions, segmentation (two), share bar, subscription, tax, taxation | biz configmap | Thin | Need one table mapping each to its handler and timeout |

### 2.2 Order {#22-order}

<a id="shared-129a19da58a7"></a>

| Item | Status | Note |
|---|---|---|
| Order history search (including "superapp", "smartdashboard" variants) | Listed | Which clients use which variant |
| Delivery tracking, consignments, packages, print status | Listed | External carrier/OMS calls not traced |
| Cancellation (`PUT /v1/order-cancel`, manual release) and bulk jobs | Listed | Link to stock release in fulfillment (E2E covers the event side) |
| Returns, replacements, return images, block-return, serial-number validation | Listed | Whole returns lifecycle missing from E2E |
| OpenSearch mapping/template admin endpoints | Listed | Index management |
| `GET /v1/orders/kafkaRetry/{timestamp_ms}` (eventservice) | Listed | Manual retry trigger; relates to RLQ (E2E §18) |
| Order jobservice: 5 CronJobs per tenant | **Covered** (E2E §23.5) | — |
| `cancelorder_raw_v1`, `returnorder_raw_v1` | Listed | CDC producers/consumers |

### 2.3 Product, taxation, CSP, cart {#23-product-taxation-csp-cart}

<a id="shared-61e5885de925"></a>

See CAT §4–§7. Product has the largest surface (about 200 operations), but checkout only uses `POST /v1/products/fetch` (biz) and bundle validation/prices. For interviews, the product items worth knowing are price timelines and adjustments, channel availability, preorder events and the multi-tenant publish service (IP Q14).

### 2.4 Findings from the audit itself {#24-findings-from-the-audit-itself}

<a id="shared-140e079549b8"></a>

1. **Two AsyncAPI contracts are unfilled templates.** `tax-event` and `csp-event` still contain the AsyncAPI "streetlights" sample, so they don't describe real events.
2. **Address topic name differs** between contract (`address_raw_v1/v2`) and deployed config (`addresses_raw_v1`).
3. **A topic is referenced in config but in no contract** (`loyaltybalancerecon_pub_v1`).
4. **Two tax services** with overlapping resources (`tax-details` in both) and two calculate endpoints (`/v1/tax/calculate` vs `/v1/tax-calculations`). E2E §12.5 says flags and master data choose; the per-market answer is still open.

<a id="shared-ddd489ab8364"></a>

5. **Order app and order data services are Quarkus native**, not Spring Boot as the end-to-end guide first said (corrected in E2E §2.2 and the interview doc).
6. **Blocking call in a reactive controller:** checkout biz `mycheckoutPeriodsController` calls `.block()` in a WebFlux controller (E2E §23.3).
7. **Loyalty refund topic configured only in global dev/perf** (E2E §23.1).

---

## 3. Next steps to close the remaining gaps {#3-next-steps-to-close-the-remaining-gaps}

In priority order for interview value:

<a id="shared-335868af4259"></a>

1. ~~Order cancellation jobs~~ (done, E2E §23.5). Remaining: returns, tracking, replacements in depth.
2. ~~mycheckout periods, challenges, tax documents~~ (done, E2E §23.2–23.4). Remaining: profiles, child checkouts, preorder.
3. ~~`loyaltybalancerecon_pub_v1`~~ (done, E2E §23.1). Remaining: address and registration consumers in the EOM adaptor.
4. Downstream-service table for checkout biz.
5. Tax service selection per market.
6. Web components and test tooling (Postman, mock service, API tests).
7. Reconcile the Word documents and text notes in `docs/`.

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
