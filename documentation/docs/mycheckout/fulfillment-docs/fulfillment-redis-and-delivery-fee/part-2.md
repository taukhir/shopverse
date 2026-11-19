---
slug: /mycheckout/fulfillment-docs/fulfillment-redis-and-delivery-fee/part-2
title: "mycheckout — Redis and Delivery Fee: Deep Dive — Part 2"
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

# mycheckout — Redis and Delivery Fee: Deep Dive — Part 2

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `fulfillment docs/FULFILLMENT-REDIS-AND-DELIVERY-FEE.md` |
| Source SHA256 | `b581f62edae73e51de6333a1796752dfa7f46834b283d64039559afe32c028e4` |
| Guide part | 2 of 2 |

[Part 1](/mycheckout/fulfillment-docs/fulfillment-redis-and-delivery-fee/part-1) · [Part 2](/mycheckout/fulfillment-docs/fulfillment-redis-and-delivery-fee/part-2)

## B3. Worked examples {#b3-worked-examples}

**Rules for `homedelivery-standard` (same start date, in the past):**

| Threshold (AMOUNT) | Fee | Users | Orders |
|---|---|---|---|
| 0 | 100 | ANY | ANY |
| 1,000 | 50 | ANY | ANY |
| 2,000 | 0 | ANY | ANY |

<a id="shared-4c5f0a66bd34"></a>

| Cart total | Tier chosen (descending scan) | Fee | Free-delivery threshold shown |
|---|---|---|---|
| 450 | 2000 ✗, 1000 ✗, 0 ✓ | 100 | 2,000 |
| 1,200 | 2000 ✗, 1000 ✓ | 50 | 2,000 |
| 2,500 | 2000 ✓ | 0 | 2,000 |
| 0 (only service items) | not applicable | 0 | 2,000 |

<a id="shared-2c73b2fb49a0"></a>

**User-type override:** add a rule {threshold 0, fee 0, users [BUSINESS_OWNER], orders ANY}. For a BUSINESS_OWNER cart of 450: criteria priority prefers user-type matches, so only this rule survives → fee 0. For a CUSTOMER, the ANY rules apply as above.

<a id="shared-df2ce2a8434d"></a>

**PV-based rule:** {thresholdType PV, threshold 100, fee 0}. A 450-baht cart with 120 PV → measured value for that rule is PV (120 ≥ 100) → free; the amount rules are evaluated separately only if they are in the effective set.

<a id="shared-3e285c5f3e75"></a>

**Rule versioning:** rules at start 2025-01-01 (fee 100) and start 2026-06-01 (fee 80). On 2026-10-22 only the 2026-06-01 set is considered; the old set is ignored entirely, even for thresholds that exist only in the old set.

**Group combined order:** two linked orders of 700 and 500 (total 1,200). Fee evaluated on 1,200 → 50, charged on order #1; order #2 pays 0.

## B4. Related calculation: allocation fee (not wired) {#b4-related-calculation-allocation-fee-not-wired}

<a id="shared-3765d6d89139"></a>

`calculateAndUpdateServiceFees` would set `fee` on allocation groups using the **first** service level's rules and the same filter. It has no production caller, so allocation responses carry no fee. Fees come only from `POST /delivery-fees`.

## B5. Gotchas to mention {#b5-gotchas-to-mention}

<a id="shared-269beccbe27f"></a>

1. The stored `ServiceFee` entity initializes `thresholdType` to AMOUNT. Calculation switches on the mapped DTO value without a null guard; an explicit null or a mapping that overwrites the initializer can still fail. The handwritten mapper is MapStruct-generated, so the entity initializer alone does not prove every nullable input is normalized.
2. Only the latest effective set is used, so adding a new generation with fewer tiers removes tiers.
3. Free-delivery threshold is picked by `serviceFee == 0`, not by "lowest threshold"; filtering uses maps, so multiple zero-fee tiers do not have a guaranteed source-list order.
4. Service items are excluded from totals and PV/BV.
5. `totalApplicableFee` is in the response schema but never populated.
6. `FulfillmentTypeFilter` restriction uses AND across the two lists (a type restricted only by user type is never hidden).
7. Currency is read from the first line; mixed-currency carts are not handled.

## B6. Delivery fee interview answers {#b6-delivery-fee-interview-answers}

<a id="shared-317fdeeb9959"></a>

- **How do you calculate the fee?** Compute the eligible total, pick the latest effective rule set, narrow by user and order type, then choose the highest threshold the total reaches.
- **How do you show "free delivery above X"?** From the first zero-fee rule in the applicable set.
- **How do PV/BV work?** They are threshold types; the same algorithm compares the PV or BV sum instead of money.
- **How do you handle group orders?** One fee on the parent, zero on children, based on combined total.
- **How do you roll out new pricing?** Add rules with a new `startDate`; they take over automatically when the date passes, and the whole old set is retired.
- **Where would you add shipping by weight or distance?** There is no such input today; it would require extending the rule model and request.

---

## Part C: Mock interview probes (rapid fire) {#part-c-mock-interview-probes-rapid-fire}

Practise answering in 20–30 seconds each.

**Redis**

<a id="shared-bfcee86c3dc8"></a>

1. Why not store locations only in Redis? *Not durable/authoritative; needs rebuild job; DynamoDB is the source.*
2. A shopper reports "no pickup locations near me" after a deploy. What do you check? *Whether the Redis loader ran, whether the geo key exists under the key the search reads (the mismatch), coordinate validity, fulfillment type, radius.*
3. How would you remove a closed store from the index? *Delete from DynamoDB, then `ZREM`/rebuild the key; today removal is not implemented.*
4. What happens when the pickup check TTL expires mid-checkout? *Confirm fails; shopper re-validates the location.*
5. Why TTL 360 s? *Balance between validating availability and not holding stale validation ids; configurable.*
6. Is the geo search paginated in Redis? *No, in memory; large radii return the whole set.*
7. Cluster vs standalone? *Config-driven by `quarkus.redis.client-type`; THA/LATAM prod use cluster endpoints.*

<a id="shared-fdd46a637bac"></a>

**Delivery fee**
8. Walk through fee calc for a 1,200 cart with the rule table above. *Apply steps 1–5.*
9. Two rules at the same threshold for different user types, what wins? *Exact user/order match; else priority user type then order type.*
10. How do you pick the "current" fee version? *Latest start date that is already in the past.*
11. Why sort thresholds descending? *So the first threshold the total meets is the best tier.*
12. How are service items treated? *Excluded from totals; zero-total orders pay a fee only if a non-service line exists.*
13. What does a combined group order pay? *One fee on the parent, 0 on children.*
14. What is `totalApplicableFee`? *Declared in the schema, not populated by this service.*
15. Where could this break? *Null threshold type, mixed currencies, missing tiers after a new generation.*

<a id="shared-3fd49615f778"></a>

**ATS and feed (from the other doc)**
16. Reserved 89, feed says 0 on hand. *Absent EOD reservation sync, reserved stays; on-hand ATS clamps to 0. A sourced reservation fails, but an allowed BO pool may still cover a request. Existing quantities need later lifecycle adjustment/release; 89 is units, not necessarily orders.*
17. EOD vs REL vs DSP? *Absolute on-hand; delta; status only.*
18. How do you prevent overselling? *Advisory lock + revalidation on RESERVE + idempotency keys.*
19. What does the intended double-deduction fix change? *Make the DTO evaluator pure and the helper the only mutator. Current source still mutates in the DTO overload called by allocation; only the entity overload is pure.*
20. NGC vs Manhattan? *Provider switch by config; Japan uses the NGC ledger.*

<a id="shared-d29e61c68038"></a>

**Design judgement**
21. What would you change first? *Fix the Redis key, wire or remove the purge, guard nulls, floor/alert on negative counters, make RLQ failures loud.*
22. How would you monitor this? *Feed freshness/lag, DLQ/RLQ depth, negative raw ATS count, reservation failures by reason, Redis geo key size, fee calculation errors.*

## D. Checkout integration and clarified boundaries {#d-checkout-integration-and-clarified-boundaries}

<a id="shared-cf3333113cd2"></a>

Checkout bizservice calls dataservice directly for delivery fees; fulfillment appservice is an additional façade, not a mandatory hop. `DeliveryFeeCalculationServiceImpl` builds fee requests, handles exemptions (including BOPIS/walk-in and eligible group/SOP cases), applies shipping promotions and updates totals. Empty fee responses can use default checkout fulfillment configuration. Therefore compare the rule-service fee with checkout's final shipping charge when explaining a discrepancy.

<a id="shared-93292f27abca"></a>

Combined-group totals and the first-request fee are evaluated **within each fulfillment-type/service-level group**, using the first request's user/order criteria; do not aggregate incompatible service-level groups into one universal fee. The free-delivery threshold uses the first zero-fee rule encountered after filtering; filtering uses maps, so do not promise a stable source-list order when several free tiers qualify.

<a id="shared-25076a8cda8a"></a>

For Estafeta, checkout's availability handler validates and its pickup-reservation handler later confirms with `availabilityCheckKey=checkoutId`. HTTP 410 is propagated by the client and converted to a pickup-not-available modification by the service; other errors can be swallowed into empty results. This handshake is separate from inventory reservation. The 360-second token TTL does not mean that stock reservations expire after six minutes.

<a id="shared-d020c95ba795"></a>

Current commands execute inside the dataservice POST chain and return after COMPLETED/FAILED is saved. Redis loader errors may be swallowed per type, and no stale-member removal exists, so neither command completion nor a fresh CronJob alone proves the geo data is correct. The write/read key mismatch remains present in checked code/configuration.

<a id="shared-be49e58a2a3e"></a>

See [the full end-to-end guide](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-4#14-the-connected-fulfillment-lifecycle-including-checkout) and [source evidence index](/mycheckout/fulfillment-docs/fulfillment-source-index/part-1). Findings are from static inspection on 2026-10-22; no live Redis, carrier or fee requests were executed.

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
