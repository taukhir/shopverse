---
slug: /mycheckout/fulfillment-docs/fulfillment-complete-context/part-2
title: "mycheckout — Completeness check — Part 2"
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

# mycheckout — Completeness check — Part 2

**Historical source notes.** Fix claims and observations retain their original dates; they have not been reverified against current runtime behavior.

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `fulfillment docs/FULFILLMENT-COMPLETE-CONTEXT.md` |
| Source SHA256 | `3a2c606cf7a59e648467aaac28b2e71642ee2cca63513f259cbb331526dad46e` |
| Guide part | 2 of 2 |

[Part 1](/mycheckout/fulfillment-docs/fulfillment-complete-context/part-1) · [Part 2](/mycheckout/fulfillment-docs/fulfillment-complete-context/part-2)

## Test-script coverage plan {#test-script-coverage-plan}

The external Python runner should be treated as an API regression suite, separate from repository unit tests. It should execute this lifecycle for each scenario:

```text
Read original stock
→ POST stock transaction
→ GET stock detail
→ GET stock listing
→ GET audit
→ POST allocation, where applicable
→ Verify allocation did not mutate stock unexpectedly
→ Restore original stock
→ Verify restoration
→ Write JSON and HTML reports
```

Required API scenarios:

<a id="shared-0fe614023060"></a>

1. All forced statuses with positive physical stock:
   `FORCE_TNA`, `FORCE_NLA`, `FORCE_NYA`, `FORCE_NAW` must return zero ATS.
2. All ship-else statuses with zero, partial and full stock.
3. `SHIP_ELSE_BACKORDER` sequential requests `90` and `990` against backorder `999`.
4. Regular plus bundle lines using the same item and warehouse.
5. Repeated transaction ID idempotency.
6. New transaction ID with identical values.
7. Stock release and over-release behavior.
8. Audit field, ordering and pagination assertions.
9. Missing item/warehouse and invalid request responses.
10. Null and omitted optional quantity behavior.

<a id="shared-78429ba5c9e5"></a>

The runner must not hide service defects by normalizing values too broadly. Treat absent/null quantities as zero only where the API contract explicitly permits Jackson omission; otherwise assert the field is present and zero.

<a id="shared-23e4b3cf3f16"></a>

Unit tests are still required for the entity overload, reservation/release strategies, null arithmetic, and direct strategy behavior. API tests alone cannot prove those internal branches.

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
