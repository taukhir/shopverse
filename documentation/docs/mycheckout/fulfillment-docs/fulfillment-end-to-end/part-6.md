---
slug: /mycheckout/fulfillment-docs/fulfillment-end-to-end/part-6
title: "mycheckout — Fulfillment: End-to-End Guide — Part 6"
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

# mycheckout — Fulfillment: End-to-End Guide — Part 6

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `fulfillment docs/FULFILLMENT-END-TO-END.md` |
| Source SHA256 | `5c0985b97fc0201d78f7a2cbf248cb7b16dba20c5e63a9f422c6568376b97eed` |
| Guide part | 6 of 6 |

[Part 1](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-1) · [Part 2](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-2) · [Part 3](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-3) · [Part 4](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-4) · [Part 5](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-5) · [Part 6](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-6)

## 18. What remains external or unproven {#18-what-remains-external-or-unproven}

<a id="shared-0e04401acc93"></a>

| Question | What is established | Evidence needed to finish it |
|---|---|---|
| AS400 publication cadence | Event-driven ingress; EOD/REL/DSP mapping; no publisher scheduler here | AS400/WebMethods scheduler/export configuration or timestamped source logs |
| Manhattan physical supply ingestion | ATP/promising/inventory clients and request/response mappings | Manhattan integration/WMS/ERP ingestion implementation and operations configuration |
| Effective deployed routing | Repository provider/channel/cron values | Rendered Helm manifests, loaded ConfigMaps/profiles, feature-flag values and active pod settings |
| Japan UAT/prod command list | CronJobs exist; no matching source profiles in this checkout | Packaged/runtime profile or external configuration defining commands |
| Physical pick/ship/delivery/returns | Reservation and incoming sales-order event contracts | OMS/WMS/carrier implementations and return/restock event contracts |
| Display consumers | Inventory availability producer exists | Product/PDP/Search consumers, subscriptions and indexing logic |
| Latency/throughput | Broker/client settings and processing structure | Measured source timestamps, Kafka lag, API/DB/CDC traces, load tests |
| Authentication and ownership guarantees | Request tuple/country selection and external auth clients are visible | Shared framework, gateway/Istio policies and caller identity/ownership validation across services |

<a id="shared-c148c81bc449"></a>

These are explicit evidence boundaries, not invented missing business behavior. No live orders, payment calls, partner calls or production mutations were made for this documentation work. No application tests were run; the validation is static source/configuration tracing and document/reference checks.

## 19. Source evidence index {#19-source-evidence-index}

<a id="shared-0e1435c925e5"></a>

The companion [FULFILLMENT-SOURCE-INDEX.md](/mycheckout/fulfillment-docs/fulfillment-source-index/part-1) links the exact local files and verified line anchors used in this expansion. It covers checkout entry points, provider implementations, arithmetic, transaction boundaries, Kafka overrides, schedules, commands, locations, fees and dates. Line anchors describe the current workspace and can move after code changes.

## 20. Supporting address, OTP, date and administration flows {#20-supporting-address-otp-date-and-administration-flows}

### 20.1 Shipping address and OTP {#201-shipping-address-and-otp}

<a id="shared-0a05166fbc4c"></a>

Appservice `ShippingAddressController` delegates to `ShippingAddressServiceImpl`. Create/update load address master configuration for country/contact type. For non-admin requests, configured OTP validation requires a challenge id and verifies both the identity challenge's verified status and context. Missing/unverified challenges fail before the write. Reads for non-admin callers check country and call `AddressOpaAuthorization`; updates fetch the existing address and perform authorization before calling dataservice. Admin branches and external identity/OPA decisions must be considered when explaining access.

<a id="shared-5001fef30cda"></a>

`POST /challenges` uses `ChallengeServiceImpl`: extract profile/account from JWT → fetch the account/profile phone → fail if absent → set PHONE mode/value → create an identity OTP challenge with generated context. `verifyOtpChallengeId` fetches the identity challenge and checks its context and `challengeVerified`. The identity system owns OTP delivery and verification; fulfillment does not implement the SMS delivery engine.

<a id="shared-0d445f7b359d"></a>

Create can also request billing-address creation when master configuration enables `copyToBilling`; appservice combines billing and shipping calls. They are separate operations, so do not assume an atomic cross-service write. Dataservice `ShippingAddressesController` selects country-specific address enrichment and address-service strategies. Shared create/update logic validates and persists through country-specific shipping-address repositories/entities in PostgreSQL. Create returns 201 for a new address or 200 with an idempotent header when the wrapper marks an existing result. Search filters include owner/account/phone/email/type/default/country; delete derives owner id from the address id before delegating. Broader gateway/identity policy behavior remains outside this trace.

### 20.2 Delivery dates are configured availability, not carrier tracking {#202-delivery-dates-are-configured-availability-not-carrier-tracking}

<a id="shared-1586da02905f"></a>

`DeliverySlotAvailabilityServiceImpl` converts the supplied ordering timestamp (or current time) to the country time zone. It selects the serviceability row valid for that postal code and timestamp, obtains its zone, and reads date rows whose order-day window includes the selected time and whose deliveryDate is strictly later. For `timedDelivery=true`, it reads the country's `DeliveryTimeSlot` master data and selects that zone's slots. The date repository query has no explicit country predicate, so zone uniqueness/tenant isolation matters. A nonserviceable postcode produces an `errors[]` response with NON_RECOVERABLE category; it is not necessarily an HTTP transport error. No slot-capacity hold or decrement is performed by this read flow. Maintaining delivery-date/serviceability rows uses their CRUD APIs; no generation scheduler was established here.

### 20.3 Stock administration and audit {#203-stock-administration-and-audit}

<a id="shared-ee86a6c57a1c"></a>

Admin stock list/detail reads derive ATS using the selected views and latest rows or explicit historical version. `MANUAL` writes apply supplied changes through a transaction strategy and store audit information. `/stock-levels/audit` is **not full inventory history**: `getStockLevelAudit` calls `findLatestManualTransactions` with size, so it lists MANUAL transactions only. It sets response offset to `page*size` but does not pass an offset to that query. Changing page therefore does not select the next audit page in the current code. Use ledger versions and transaction identifiers when investigating nonmanual feed/reservation history.

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
