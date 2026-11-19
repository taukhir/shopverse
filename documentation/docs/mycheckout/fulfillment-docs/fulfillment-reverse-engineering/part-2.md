---
slug: /mycheckout/fulfillment-docs/fulfillment-reverse-engineering/part-2
title: "mycheckout — Fulfillment reverse-engineering reference — Part 2"
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

# mycheckout — Fulfillment reverse-engineering reference — Part 2

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `fulfillment docs/FULFILLMENT-REVERSE-ENGINEERING.md` |
| Source SHA256 | `bea47a9e058dda62a758b40ad017f76fdb9aeacf2790b1fbf00e28f127c57d5c` |
| Guide part | 2 of 2 |

[Part 1](/mycheckout/fulfillment-docs/fulfillment-reverse-engineering/part-1) · [Part 2](/mycheckout/fulfillment-docs/fulfillment-reverse-engineering/part-2)

## 5. Persistence map and consistency {#5-persistence-map-and-consistency}

<a id="shared-be1c6c000509"></a>

| Resource | Concrete storage/model | Identity / consistency implications |
|---|---|---|
| Stock | PostgreSQL `fulfillment.stock_level` | `(item_code, warehouse_code, version, country)`; append versions; transaction advisory lock for stock key |
| Delivery dates | PostgreSQL `fulfillment.delivery_dates` | id, ordering window, delivery date, zone, country, optimistic version |
| Postal serviceability | PostgreSQL `fulfillment.postalcode_serviceability` | id; postcode/country and validity select zone/warehouse; optimistic version |
| Shipping addresses | Country-specific entities/repositories; SQL shipping-address tables | Identity includes address/purpose in common schema; migrations/entity variants must match the environment |
| Fulfillment types and fee rules | Dynamo logical table `fulfillment` | id + country sort key; Dynamo version attribute; nested serviceLevels/fees |
| Service locations | Dynamo logical table `servicelocation` | id + country; type/country and postcode/type/country secondary indexes; batch id supports pruning |
| Post locations | Dynamo logical table `postlocationentity` | id partition key; country/postcode/warehouse set in item |
| Commands | Dynamo logical table `command` | command id derived from idempotency header; named strategy and status |
| Geo index | Redis GEO sorted sets | Derived location index; no TTL/removal established for geo members |
| Pickup-check token | Redis string value | Checkout/check key, validation id, configured 360-second TTL |

<a id="shared-a8dbc3dbf673"></a>

Logical Dynamo names above are entity constants; environment table providers may supply physical names. A SQL entity declaration is not proof the matching migration ran. In the checked source, Japan QA/UAT have next-availability/discontinuation column migrations not mirrored by identically named prod migrations; compare actual schemas before claiming parity.

<a id="shared-5db68b365b42"></a>

Stock read formulas, the ten selling statuses and the worked reservation lifecycle are in the end-to-end guide §15. The current DTO allocation overload still mutates supply in addition to the helper's reservation-counter mutation; only the entity overload is pure. This remains a current code observation, not a newly applied fix.

## 6. Complete feed and worker matrix {#6-complete-feed-and-worker-matrix}

<a id="shared-514c475bb5bb"></a>

| Trigger/channel | Payload | Path and status in checked code |
|---|---|---|
| `readInventoryAtsEvent` | AS400 Protobuf bytes | Active Japan feed → mapping → stock POST |
| `readInventoryAtsEventRlq` | Same bytes + retry headers | Delayed retry/reprocess → retry/DLQ on failure |
| `readSalesOrderEvent` | Sales-order Avro | Validate → config disable gate → event type strategy → stock batch; unsupported types ignored |
| `readSalesOrderRlqEvent` | Same order event | Delayed retry; unknown failures DLQ+nack unlike AS400 RLQ ack |
| `stock-level-cdc-events` | Avro stock CDC | Historical reads → selective availability events; consumer failure routes to error producer |
| `dailyfeed-inventory-events` | Legacy balance Avro | Disabled in checked config; validator → group by item/warehouse → sum quantities → aggregated producer |
| `inventory-aggregated-in` | Aggregated Detail Avro | Disabled; calls stock creation with an empty request DTO, so payload-to-stock mapping is incomplete |
| `intraday-inventory-events` | Legacy inventory Avro | Disabled; logs event details with TODO for dataservice write; not a functioning stock updater |
| Location CronJobs | Country/profile/bean ids | Partner upsert/cleanup and optional Redis load; schedules do not imply every source is configured |
| Stock retention method | Direct method invocation | No located production trigger for `purgeOldStockLevels` |

<a id="shared-f2de182d7b9f"></a>

Legacy aggregation groups by base item and warehouse id (fallback warehouse code), sums integer quantities, defaults invalid quantity text to zero, and mutates the first detail as aggregate output. Do not present this disabled path as the live Japan Protobuf path.

<a id="shared-b67bd718771c"></a>

The catalog lists all 17 `@Incoming` / `@Channel` registrations and their source locations. Source registration does not establish effective enablement, partition count, live group membership or producer delivery.

## 7. Integrations and configuration switches {#7-integrations-and-configuration-switches}

<a id="shared-e9da6e3e516d"></a>

| Integration/switch | Where it changes behavior |
|---|---|
| `config.ats-service` | NEXTGEN ledger versus Manhattan allocation/reservation; base config Manhattan, Japan overrides NEXTGEN |
| Manhattan ATP/promising/inventory/order/org | Availability, confirmed reservations, deletes, postcode warehouse resolution and location loading; upstream supply ingestion is external |
| OMS/Value Chain shipping restrictions | Can restrict candidate delivery options in pickup/allocation flows |
| Kerry / 7-Eleven / Pickit / Estafeta / Hybris | Location imports or live pickup calls; presence does not prove a scheduled command |
| Identity OTP, account/phone and LOS | Address challenge creation, verified-context checks and ownership/upline authorization |
| Product and checkout clients in appservice | Product/checkout enrichment and address-related orchestration; see source inventory for methods |
| Feed reservation-sync flag + reserve-sync SKU list | Allows EOD reserved overwrite for selected traffic |
| `config.salesorder-eventprocessing-disable` | Sales-order consumer can validate then skip stock processing; a consumed event need not imply a write |
| Country/view config and event view aliases | Controls returned view calculations and additional published view names |
| Backorder-as-available and disabled pickup-location config | Changes candidate pickup availability/visibility |
| `config.ttl-for-redis-key` | Pickup-check token lifetime, default/configured 360 seconds; not stock-reservation expiry |
| `config.enable-execution` + Spring tenant profile + country | Whether jobservice executes and which commands it runs |
| Client timeout/retry configuration | Annotation defaults can be overridden by application YAML, ConfigMaps or runtime environment |

<a id="shared-29a76f860e55"></a>

Never infer production values solely from annotation defaults or dev YAML. The full guide §16 records checked environment-specific topics and cron fields. Runtime flags, loaded config, external framework routing and ingress authorization remain separate evidence boundaries.

## 8. Failure behavior and gaps {#8-failure-behavior-and-gaps}

<a id="shared-ab424d3e0ae1"></a>

| Failure | Handling / limitation |
|---|---|
| Insufficient NEXTGEN reservation | Stock strategy rejects; reservation controller returns 409; checkout client can convert to empty optional and validation adds modification |
| Concurrent stock transactions | Per-key lock plus transactional versions; no cross-system atomicity |
| Wrapped network failure / HTTP 503/504 from stock API | Mapped to recoverable → RLQ; configured delayed retry and exhaustion → DLQ |
| HTTP 429/403 | All 4xx checked first → client error/DLQ; 403 in recoverable helper is unreachable after that check |
| Other HTTP status mapped nonrecoverable, including 500 | ServerErrorException → DLQ in feed handler |
| AS400 parser/unknown exception | Main consumer publishes DLQ and nacks; AS400 RLQ unknown exception publishes DLQ and acks |
| Retry or availability publication failure | Producers can log/swallow; input acknowledgment can coexist with missing downstream publication |
| Duplicate/reordered feed | REL can apply twice; delayed EOD can overwrite supply; source timestamp ordering/deduplication not established |
| Reserved exceeds supply | Numerical ATS clamps to zero; stored counters are not automatically repaired or orders cancelled |
| Release or on-hand adjustment overdraw | Can drive counters negative; no floor in those strategies |
| Redis refresh/search | Key mismatch, stale members, per-type swallowed GEOADD errors and in-memory full-radius pagination |
| Fee generation/criteria | Latest start generation replaces older tiers; endDate unused; first free rule not guaranteed lowest threshold |
| Stock audit paging | MANUAL-only query ignores page offset even though response metadata sets one |
| Address/fee/date/postlocation updates | Different identity/version rules and external dependencies; not interchangeable generic CRUD |

<a id="shared-2bb2b8c32d92"></a>

Dataservice's global exception mappers produce structured JSON for HttpProblem/WebApplicationException and fallback errors, with status/detail/timestamp and extensions where available. Reservation insufficient-stock recovery is special: it can return a bare 409, so not every error has that JSON body. Contract response declarations and actual controller statuses may differ; catalog codes are explicitly labeled as declared.

## 9. Verification and external boundaries {#9-verification-and-external-boundaries}

<a id="shared-0172fa471d90"></a>

Performed: current revision/working-tree inspection; contract parsing and local `$ref` resolution; all operationId/controller-name comparisons; source registration inventory; main execution-path reads; document links/line-anchor checks. The generator can rebuild and validate the extracted snapshot. No application integration/load tests or production observations were performed.

<a id="shared-8ae360b8d4b6"></a>

Still external/unproven: AS400 publication schedule, WebMethods extraction internals, Manhattan supply ingestion, CDC connector configuration, effective production flags/configuration, Japan UAT/prod job command profiles, physical OMS/WMS/carrier/returns behavior, and downstream Product/Search consumers. Those cannot be honestly reconstructed from missing implementations.

## 10. Documentation navigation {#10-documentation-navigation}

<a id="shared-fe95989437e7"></a>

| Artifact | Use |
|---|---|
| [API catalog](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1) | All 86 contract operations, parameters, bodies, responses, controller links and schema inventory |
| [JSON catalog](/mycheckout/fulfillment%20docs/FULFILLMENT-CATALOG.json) | Full contract components and extracted machine-readable inventory |
| [Configuration registrations](/mycheckout/fulfillment-docs/fulfillment-configuration-catalog) | Source config keys/prefixes and anchors; no effective environment values |
| [End-to-end guide](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-1) | Detailed arithmetic, provider split, checkout handoffs, schedules and sequence diagrams |
| [Source index](/mycheckout/fulfillment-docs/fulfillment-source-index/part-1) | Verified implementation anchors, including this pass's additions |
| [Redis and fee deep dive](/mycheckout/fulfillment-docs/fulfillment-redis-and-delivery-fee/part-1) | Detailed algorithms and examples |
| [Interview guide](/mycheckout/fulfillment-docs/fulfillment-interview-prep/part-1) | Explain the implementation and known limitations in interview format |
| Catalog generator (local reference: `tools/build_fulfillment_catalog.py`) | Rebuild extracted documentation; requires Python and PyYAML |

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
