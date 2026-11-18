---
slug: /mycheckout/end-to-end-system/part-5
title: "mycheckout — NextGen Commerce: End-to-End System Guide — Part 5"
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

# mycheckout — NextGen Commerce: End-to-End System Guide — Part 5

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `END-TO-END-SYSTEM.md` |
| Source SHA256 | `4d1f4d3804f7dd242a206764ce0bbf48f087371f0c8bf643aa9ecd1038ae3228` |
| Guide part | 5 of 6 |

[Part 1](/mycheckout/end-to-end-system/part-1) · [Part 2](/mycheckout/end-to-end-system/part-2) · [Part 3](/mycheckout/end-to-end-system/part-3) · [Part 4](/mycheckout/end-to-end-system/part-4) · [Part 5](/mycheckout/end-to-end-system/part-5) · [Part 6](/mycheckout/end-to-end-system/part-6)

## 13. Kafka topic map {#13-kafka-topic-map}

Names are shown without the `commerce_<env>_<tenantCode>_` prefix. Error topics follow `<entity>-<consumer>-<dlq|rlq>_error_v1`.

<a id="shared-6833533557df"></a>

| Topic | Producer | Consumers |
|---|---|---|
| `checkout_raw_v1` | `comcheckoutds` DynamoDB stream (CDC Lambda) | `comcheckoutes` |
| `checkout-comcheckoutes-rlq_error_v1` | `comcheckoutes` (failed checkout events) | `comcheckoutes` RLQ consumer |
| `checkout-comcheckoutes-dlq_error_v1` | `comcheckoutes` (retries exhausted) | none in workspace |
| `checkout-comcheckoutds-dlq_error_v1` | CDC connector failures; `comcheckoutds` `EventProducer` | none in workspace |
| `salesorder_pub_v1` | `comcheckoutes` DynamoDB stream; manual publish for large orders | EOM (external), `comfulfillmentes`, `comorderes` |
| `salesorder-comcheckoutes-dlq_error_v1` | `comcheckoutes` (validation failures) | none in workspace |
| `salesorderpayments_pub_v1` | Payment / EOM (external) | `comcheckoutes`, `comorderes` |
| `salesorderhistory_pub_v1` | `comorderes`, EOM (external) | `comorderes` bulk consumer |
| `salesorder-comorderes_s3_{dlq,rlq}_error_v1` | `comorderes` | `comorderes` retry consumer |
| `addresses_raw_v1`, `shippingaddress_raw_v1`, `contact_pub_v1`, `registration_pub_v1`, MDMS `mdms.<env>.<code>.v2.contact.address[-book]` | address / contact / registration / MDMS (external, plus checkout address events) | `comcheckoutes` |
| `stocklevel_raw_v1` | fulfillment Postgres CDC | `comfulfillmentes` |
| `inventory-availability_pub_v1` | `comfulfillmentes` | product, search (external) |
| AS400 inventory (Protobuf) | WebMethods (external) | `comfulfillmentes` |
| `product_raw_v2`, `price_raw_v2`, `inventory_raw_v1`, `item_raw_v2`, category and classifier topics | product data CDC | `publishservice` |
| `product_pub_v1`, `product-tuples_raw_v1`, `product-searchindexupdate_raw_v1` | `publishservice` | search and others (external) |
| `bundle-avail-calc_raw_v1`, `bundle-price-event_raw_v1` | `ingestservice` | product (internal) |

Japan QA hard-codes `commerce_qa_070_salesorder_pub_v1` in the EOM adaptor producer config instead of using `${tenantCode}` **(config)**.

---

## 14. Feature flags {#14-feature-flags}

<a id="shared-7d6c400167ce"></a>

45 checkout flags are registered in `checkout/commerce-checkout-api/source/features-flags/*.json`, namespace `checkout`. The code reads `checkout.<key>`. "Registry default" is the `default_variant` in the JSON; "state" is whether the definition is active. The deployed value lives in flagd and can differ. "Read by" comes from a search of `source/app/src/main/java` in biz and the EOM adaptor (app tier and data tier read none). "Not found" means no backend Java reference was found; the flag may be read by web components or cart, or may be obsolete.

<a id="shared-a4cc1a49fbd0"></a>

| Key (`checkout.` prefix) | Registry default | State | Read by | Purpose |
|---|---|---|---|---|
| `place.order.internal.handle.support.enable` | off | ENABLED | biz | **Switches place order to the internal handler sub-pipeline** (§6.3) |
| `place.order.enable` | on | ENABLED | biz | Place order on/off (described as the Japan kill switch) |
| `fields.validation.support.enable` | off | ENABLED | biz | Pre-sales-order field validation (also needs master data `preSalesOrderValidationEnable`) |
| `item.backorder.status.support.enable` | on | ENABLED | biz | Item backorder status support |
| `disable.pos.checkout.recalculation` | off | ENABLED | biz | Skip recalculation in GET checkout for POS |
| `shipping.fee.promotion.strategy.support.enable` | off | ENABLED | biz | Shipping-fee promotion uses config instead of checkout strategy |
| `new.address.api.support` | off | ENABLED | biz | Migrated address API |
| `event.based.loyalty.refund` | off | ENABLED | biz | Loyalty refund through Kafka |
| `registration.add.shipping.address.enable` | off | ENABLED | biz | Add shipping address during registration |
| `fiscal.name.tax.support` | off | ENABLED | biz | Tax fiscal name |
| `calculate.taxation.service.support.enable` | off | ENABLED | EOM adaptor | Recalculate taxes through the taxation service |
| `eom.calculations.validation.enable` | off | ENABLED | EOM adaptor | Validate EOM calculations |
| `price.calculation.strategy.override` | on = `GROSS` (off = `NET`) | ENABLED | EOM adaptor | Price calculation strategy |
| `populate.payment.details.override` | on | ENABLED | not found | Populate payment details in EOM |
| `account.balance.adjustment.pv.bv.support.enable` | on | DISABLED | not found | Account balance PV/BV adjustment |
| `account.process.patch.api.enable` | off | ENABLED | not found | Renewal/upgrade/downgrade submit API |
| `address.otp.validation.flow.enable` | off | ENABLED | not found | Address OTP validation |
| `adjust.line.taxes.support.enable` | off | ENABLED | not found | Adjust line taxes |
| `billing.address.handling.support` | off | ENABLED | not found | Billing address handling |
| `delivery.fee.api.enable` | off | DISABLED | not found | Delivery fee API |
| `e2e.layout.for.checkout.pages.enable` | off | ENABLED | not found (UI) | E2E page layout |
| `email.phone.api.enable` | on | DISABLED | not found | Email/phone API |
| `enableMigratedAddressComponents` | off | ENABLED | not found (UI) | Migrated address components |
| `go.gco.pv.bv.adjustment.support.enable` | off | ENABLED | not found | PV/BV adjustment for GO/GCO |
| `map.confirm.cta.enable` | off | DISABLED | not found (UI) | Map confirm CTA |
| `multiStepFlowEnable` | off | ENABLED | not found (UI) | Multi-step flow |
| `multiple.coupon.support.enable` | on | ENABLED | not found | Multiple coupons |
| `payment.retry.support.enable` | on | ENABLED | not found | Payment retry |
| `pickupStoreWithBillingAddressVisibility` | off | ENABLED | not found (UI) | Pickup store with billing address |
| `populate.tax.document.enable` | off | ENABLED | not found | Populate tax document |
| `proration.promotion.library.support.enable` | off | ENABLED | not found | Prorated promotion merge |
| `purchase.restriction.support.enable` | on | ENABLED | not found | Purchase restriction |
| `rationing.bundle.integration.support.enable` | off | ENABLED | not found | Rationing for bundles |
| `rationing.v2.integration.support.enable` | off | ENABLED | not found | Rationing v2 API |
| `registration.loading.popup.with.illustration` | off | ENABLED | not found (UI) | Registration popup |
| `segmentation.v2.integration.enable` | off | ENABLED | not found | Segmentation v2 |
| `subtotal.excluded.fee.support.enable` | off | ENABLED | not found | Exclude renewal/registration fees from subtotal |
| `tax.calculation.by.tax.code.enable` | on | ENABLED | not found | Tax by tax code |
| `tax.invoice.support` | off | ENABLED | not found | Tax invoice |
| `tax.service.integration.enable` | off | ENABLED | not found | Tax service integration |
| `taxpayer.document.support.enable` | on | DISABLED | not found | Taxpayer document |
| `use.billing.same.as.shipping.support` | off | ENABLED | not found | Billing same as shipping |
| `profile.update.enable` | on | ENABLED | not found by key | Checkout profile update. Biz uses `checkoutUtil.isUserCheckoutProfileEnable()` (§6.4); whether that reads this flag was not traced |
| `user.pipeline.strategy.enable` | off | ENABLED | not found | User pipeline strategy |
| `warranty.item.support.enable` | on | DISABLED | not found | Warranty items |

Flags read in code but **missing from the registry**, so they always use the code default unless flagd defines them elsewhere:

<a id="shared-2c099d7e5b4c"></a>

| Key | Code default | Read by |
|---|---|---|
| `checkout.promotion.biz.tier.enable` | false | biz (`FeatureToggleKey`) |
| `checkout.mandatory.tax.fields.validation.enable` | false | biz (`FeatureToggleKey`) |
| `webshop.enablePurchaseAddressExtendedAttributes` | false | biz (`FeatureToggleKey`, webshop namespace) |

Other switches that are Spring properties, not flags **(config)**:

<a id="shared-32537e69a525"></a>

| Property | Value (base → local) | Effect |
|---|---|---|
| `checkout.subscription.reservation.enable` | true → false | Reserve inventory for AUTO_SOP |
| `checkout.operation.place-order.skip-step.timeout.seconds` | 60 → 0 | Handler skip window (§5.2) |
| `checkout.operation.place-order.rationing.enable` | false | Rationing on place order |
| `checkout.operation.place-order.step-handlers` | declared | **Unused** (§5.2) |
| `checkout.opa.enable`, `checkout.tax-document.validation.enable` | false | OPA, tax document validation |
| `promotion.strategy.autoApply` | true | Promotion auto-apply |
| `service.*.timeout-in-ms` | 500 to 15000 | Per-dependency timeouts (payment 15000, product 1500, fulfillment 3000) |
| EOM adaptor `sales.order.publish.enable`, `sales.order.dynamoDB.ttlInSeconds`, `sales.order.dynamoDB.maxOrderLinesLimit`, `failed.event.retry.count.salesorder` | true, 3600, …, 3 | Sales order publishing and retries |
| Fulfillment `config.ats-service` | `manhattan` (Japan `nextgen`) | ATS provider (§12.2) |

---

## 15. Master data that changes behaviour {#15-master-data-that-changes-behaviour}

<a id="shared-2c954d6e11c9"></a>

| Master data | Location | Effect |
|---|---|---|
| `handlerconfig` v1 | `commerce-checkout-api/source/handlerconfig/v1/data-*.json` | `HandlerExecutor` drops handlers per country by classification and client id. **Japan** excludes SHAREBAR, POPULATE_SEGMENT, PREPARE, RATIONING, ENRICH_FULFILLMENT, SOP and INVENTORY_RESERVATION for `PREORDER` checkouts from `ngc_web` and `jpn_gem`, and PAYMENT_PROCESSING for `PREORDER` from `ngc_web` only. LATAM and Thailand have empty rules |
| `config` v1 | `commerce-checkout-api/source/config/v1/data-*.json` | Per-country checkout config, for example `preSalesOrderValidationEnable` |
| Cart config, currency, award levels, sales entity, tax, address, contact, shipping address | consumed via `master-data-starter` (versions in biz `CLAUDE.md`) | Pricing, formats and validation |
| Fulfillment master data | `commerce-fulfillment-api` | Fulfillment types, service levels, slots, time zones (see fulfillment configuration catalog) |

<a id="shared-cdff07ebc29f"></a>

BOOKING (Japan room booking) exclusions are **not** master data. They are hard-coded `isApplicable`/early-return guards using `checkoutUtil.isBookingChannel()`, listed in `commerce-checkout-bizservice/CLAUDE.md`.

---

## 16. Markets, tenants and strategy routing {#16-markets-tenants-and-strategy-routing}

<a id="shared-818fea3b9065"></a>

| Tenant | Code | Countries | Step-handler strategy | Internal place order | Fulfillment ATS | Notes |
|---|---|---|---|---|---|---|
| `jpn` | 070 | JP | Japan | Japan (sequential) | NEXTGEN ledger | Delivery slots, ampoints, handling fee, invoice number, share bar, preorder via Hybris, BOOKING channel |
| `tha` | 200 | TH | Thailand = Default | Default | Manhattan | Leads API (`gw.dev.abopool.mycheckout.co.th`) |
| `latam` | 170 | CO, HN, SV, GT | LATAM | Default | Manhattan | Tax threshold validation |
| `latam` | 170 | MX | Mexico (extends LATAM) | Default | Manhattan | Estafeta pickup points, pickup confirmation step |
| `latam` | 170 | AR, CL, PA, CR | **Default** (not in `LATAM_STRATEGY`) | Default | Manhattan | Present in handlerconfig master data, but strategy routing treats them as default |
| `global` | 000 | — | Default | Default | dev: NEXTGEN | Dev and perf |
| `ap2` | 100, 220, 350 | MY, SG, BN, ID, PH | Default | Default | not verified | Multi-tenant instances (`nx.framework.instance.enabled`) |

---

## 17. Local development guide {#17-local-development-guide}

**Prerequisites**

<a id="shared-6ffecfd4c30a"></a>

- Java 17 for the Spring Boot services, Java 21 for the Quarkus CSP and taxation services.
- AWS CLI with access to CodeArtifact domain `amcontroller-apac-prod` in `ap-southeast-1`.

**Get dependencies**

```bash
export CODEARTIFACT_AUTH_TOKEN=$(aws codeartifact get-authorization-token \
  --domain amcontroller-apac-prod --domain-owner 386077922041 \
  --query authorizationToken --output text)
export CODEARTIFACT_REPO_URL=https://amcontroller-apac-prod-386077922041.d.codeartifact.ap-southeast-1.amazonaws.com/maven/amstack-nextgen/
cd <repo>/source && ./gradlew build -x test
```

**Run one service**

<a id="shared-2458cc5856cd"></a>

| Service | Command | Local port / path | Needs |
|---|---|---|---|
| checkout biz | `TENANT_ENV=local ./gradlew :app:bootRun` | 8080 `/comcheckoutbs` | Downstream URLs in `application-local.yml`, or the Microcks mock service |
| checkout data | same | `/comcheckoutds` | DynamoDB (local or AWS), PostgreSQL with `DB_*` variables, `TENANT_NAME` for Flyway paths |
| EOM adaptor | same | 9090 `/comcheckoutes` | Kafka `localhost:9092`, Schema Registry `localhost:8081`, DynamoDB Local `localhost:8000` |
| fulfillment (Quarkus) | `./gradlew quarkusDev` | see `fulfillment/docs` | PostgreSQL, DynamoDB, Redis |

<a id="shared-44dd478a6522"></a>

**Set the market.** Strategy routing uses the country tuple header, so a local call must send the market headers. The Postman collections in `postman/` (`CHECKOUT API.postman_collection*.json` with environment files for AJ QA/UAT, Global Dev/Perf, LATAM Prod) show the header set. Treat the environment files as secrets.

**Sample data.**

<a id="shared-b2e569649f80"></a>

- `sample orders/` holds real-looking request and response payloads for TH, JP, Costa Rica and backorder cases. `NRC & RC Defect.txt` contains raw bearer tokens and personal data; do not share or commit it.
- `dynamoDb/` holds sample fulfillment, command, service-location and post-location items.

<a id="shared-a67285600aee"></a>

**Tests.** `./gradlew test` per repo (JUnit 5, reactor-test). `fulfillment/fulfillment-api-tests` has API tests (`run-tests.cmd`, `run-offline-tests.cmd`). Product dataservice has Karate tests.

**Local caveats**

<a id="shared-0f6b10a2a50a"></a>

- `application.yml` sets `skip-step.timeout.seconds: 0`. With 0, a handler is skipped while the checkout's `lastUpdatedAt` equals the current second, which is effectively never.
- The base configmap uses 60, so in deployed environments a handler is skipped when the checkout was updated within the last minute. Keep this in mind when replaying requests quickly.

---

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
