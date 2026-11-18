---
slug: /mycheckout/fulfillment-docs/fulfilment-understanding-notes/part-1
title: "mycheckout — Fulfilment Engineering Reference — Part 1"
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

# mycheckout — Fulfilment Engineering Reference — Part 1

**Historical source notes.** Fix claims and observations retain their original dates; they have not been reverified against current runtime behavior.

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `fulfillment docs/Fulfilment-Understanding-Notes.md` |
| Source SHA256 | `a5038e900518beb380d5a45f9410df582bb44b27328c0ea640d9ff9421adaa6a` |
| Guide part | 1 of 4 |

[Part 1](/mycheckout/fulfillment-docs/fulfilment-understanding-notes/part-1) · [Part 2](/mycheckout/fulfillment-docs/fulfilment-understanding-notes/part-2) · [Part 3](/mycheckout/fulfillment-docs/fulfilment-understanding-notes/part-3) · [Part 4](/mycheckout/fulfillment-docs/fulfilment-understanding-notes/part-4)

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-bug-context#shared-e53940a14ac1).

## Fulfilment Engineering Reference {#fulfilment-engineering-reference}

<a id="shared-e48411f904ba"></a>

Updated 12 October 2026. This reference explains stock persistence, audit, ATS, allocation, reservation, inventory feeds and channel exceptions for mycheckout fulfilment. Use it to trace behaviour from a business event to the API, strategy and stock version.

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-1#shared-be7e547854b0).

<a id="shared-11627d770a1b"></a>

**Reading guide:** Sections 1 to 8 retain the implementation walkthrough and SQL. Sections 9 to 13 add the inventory business rules, integration design, lifecycle and decision register. Sections 14 and 15 record regression evidence, project context and source provenance.

<a id="shared-c41417491049"></a>

**Evidence labels:** Business rule means the 12 October business specification; design means the attached ATS architecture; reviewed implementation means the previously inspected source or dated code review. Design goals and example payloads are not proof of deployed behaviour. Conflicts remain visible in section 13.

## 1 Audit flow and attribute change checks {#1-audit-flow-and-attribute-change-checks}

The write path records audit information; the audit GET endpoint formats it later. It does not compare two stock versions at read time.

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-1#shared-e81980c92125).

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-1#shared-5477df3d567a).

**How explicit null is distinguished from an omitted date:** the date request fields use `JsonNullable`.

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-1#shared-e2f3004e584e).

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-1#shared-d8a4595ac8b8).

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-1#shared-909d6abb037e).

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-1#shared-b1fbba69c039).

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-1#shared-1abc3650d015).

**Limits in the shared implementation:**

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-1#shared-570c75dee9e5).

## 2 Create stock and persistence {#2-create-stock-and-persistence}

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-1#shared-e486a773d2b8).

<a id="shared-b50697700154"></a>

Persistence is tenant-aware PostgreSQL through the reactive service/repository flow. The service has `@WithTransaction` and `@WithTenantAwareTransaction`. The attached architecture identifies the table as `stock_level`, with primary key `(item_code, warehouse_code, version, country)`, and specifies version advancement as latest version plus one. Tenant schema, actual migrations, first-version initialisation and omitted-field defaults still require validation against the running service. [S1]

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-1#shared-c2addf06ea0f).

## 3 Update stock {#3-update-stock}

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-1#shared-2ef92d61286f).

For MANUAL:

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-1#shared-80bccaecf240).

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-1#shared-9010690f8db9).

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-1#shared-007b0994ecd2).

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-1#shared-cd80736f2934).

## 4 Stock queries and historical state {#4-stock-queries-and-historical-state}

<a id="shared-d9125b45f953"></a>

**These are read-only PostgreSQL diagnostic queries based on the `stock_level` DDL in the attached architecture [S1].** Run them with the correct tenant schema in `search_path`, or qualify `stock_level` with that schema. Confirm the deployed migration matches the design. Named parameters use SQL-client bind syntax; these are not verbatim repository statements.

Find candidate tables and inspect their columns:

```sql
SELECT table_schema, table_name
FROM information_schema.columns
GROUP BY table_schema, table_name
HAVING COUNT(*) FILTER (WHERE column_name = 'item_code') > 0
   AND COUNT(*) FILTER (WHERE column_name = 'warehouse_code') > 0
   AND COUNT(*) FILTER (WHERE column_name = 'version') > 0
ORDER BY table_schema, table_name;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = :schema_name
  AND table_name = :table_name
ORDER BY ordinal_position;
```

Latest persisted stock for one item/warehouse/country:

```sql
SELECT s.*
FROM stock_level s
WHERE s.item_code = :item_code
  AND s.warehouse_code = :warehouse_code
  AND s.country = :country
ORDER BY s.version DESC
LIMIT 1;
```

Stock as recorded at or before a timestamp:

```sql
SELECT s.*
FROM stock_level s
WHERE s.item_code = :item_code
  AND s.warehouse_code = :warehouse_code
  AND s.country = :country
  AND s.created_at <= CAST(:as_of AS timestamptz)
ORDER BY s.version DESC
LIMIT 1;
```

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-1#shared-32ba2bdec18c).

All stock keys at that time:

```sql
SELECT DISTINCT ON (s.country, s.item_code, s.warehouse_code) s.*
FROM stock_level s
WHERE s.country = :country
  AND s.created_at <= CAST(:as_of AS timestamptz)
ORDER BY s.country, s.item_code, s.warehouse_code, s.version DESC;
```

Full transaction history for a stock key, including reservation/release rows:

```sql
SELECT s.*
FROM stock_level s
WHERE s.item_code = :item_code
  AND s.warehouse_code = :warehouse_code
  AND s.country = :country
ORDER BY s.version DESC;
```

See the [shared definition](/mycheckout/fulfilment-understanding-notes/part-1#shared-4ab585e4aad6).

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
