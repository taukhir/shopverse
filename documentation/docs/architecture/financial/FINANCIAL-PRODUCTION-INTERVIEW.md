---
title: Financial Production Scenarios And Interview Workbook
description: Lead and architect questions for ledgers, payments, reconciliation, settlement, batch, controls, incidents, scaling, and disaster recovery.
difficulty: Advanced
page_type: Interview
status: maintained
prerequisites: [Financial systems architecture path]
technologies: [Java, Spring Boot, Kafka, SQL, Spring Batch]
last_reviewed: "2026-07-28"
scope: generic
owner: docs-architecture
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Financial Production Scenarios And Interview Workbook

Use one answer structure:

```text
invariant and authority
-> internal state and failure window
-> evidence and diagnosis
-> immediate safe containment
-> idempotent recovery and reconciliation
-> prevention, controls and proof
```

## Core Interview Questions

### Why not use `double` for money?

Binary floating point cannot exactly represent many decimals. Use an exact governed model—often
`BigDecimal` or integer minor units—with currency metadata, scale/range and explicit rounding.

### Why use double-entry postings?

Balanced postings make value movement explicit and checkable. They support audit, reversal,
reconstruction, and reconciliation better than overwriting a balance. They do not replace approved
product accounting rules or prevent every defect.

### Is the ledger a Kafka topic?

Kafka can distribute ordered events, but an authoritative ledger needs balanced atomic posting,
constraints, queryable history, access controls, and recovery evidence. Calling a topic "the ledger"
does not supply those properties.

### Exactly-once payment processing?

No switch guarantees it across client, application, database, Kafka, provider, and bank. Combine
stable identity, uniqueness, guarded transitions, provider idempotency, outbox/inbox, immutable
postings, and reconciliation. State the exact boundary of every transaction.

### What is reconciliation for?

It compares independent authorities to detect missing, duplicate, mismatched, late, or incorrectly
valued operations and routes exceptions to controlled resolution.

## Production Scenarios

### 1. Capture times out

Mark it unknown, preserve the provider key/reference, do not create a new-key capture, accept a
verified callback or query status, reconcile, and publish one guarded outcome.

### 2. Callback arrives twice and out of order

Authenticate, deduplicate provider event identity, correlate operation/amount/currency, and apply a
conditional transition. Do not move `REFUNDED` back to `CAPTURED`.

### 3. Ledger committed but response was lost

The outcome is ambiguous to the caller. A retry with the same operation key returns the existing
transaction. Do not compensate until authoritative state is known.

### 4. Ledger transaction is unbalanced

Reject before commit. If found in posted data, freeze unsafe actions, preserve evidence, quantify
scope, and correct using approved linked adjustments—never rewrite history.

### 5. Balance projection differs from postings

Stop consistency-sensitive use of the projection, compare checkpoint/version and delivery evidence,
rebuild into a new projection, verify totals, then switch traffic.

### 6. Two withdrawals race

Enforce available funds atomically with conditional update, lock/version, or account ownership.
Reading then writing in separate unguarded statements is unsafe.

### 7. Kafka event is missing after database commit

Use a transactional outbox and monitor unpublished age. Reconstruct an already-lost event from
authoritative state with controlled backfill and idempotent consumers.

### 8. Outbox row published twice

This is expected under at-least-once relay. Consumer uniqueness and business invariants prevent
duplicate effects. Marking published before acknowledgement creates loss instead.

### 9. One Saga participant is down

Retain pending state and deadline, use bounded safe retry or status query, then move aged cases to
reconciliation. Lack of reply does not prove the participant did nothing.

### 10. Refund succeeds externally but local update fails

Keep the refund identity and unknown state, query or consume callback, then reconcile and post
entries idempotently. Never issue another refund with a new identity blindly.

### 11. Reconciliation file is duplicated

Identify provider/date/sequence/checksum uniquely, make ingestion idempotent, and use stable row
identity. Control totals must expose duplication.

### 12. One bad row exists in a settlement batch

Preserve file and totals. Apply an approved all-or-nothing or quarantine policy. A skipped row
produces an explicit incomplete result and owned break.

### 13. Batch crashes after 99 external calls

Database rollback cannot undo the calls. Query by stable external operation identity or use an
outbox/staged-command design. Restart only after classifying external effects.

### 14. End-of-day close is late

Identify the blocked gate and deadline, preserve inputs, contain optional work, restart safely,
verify totals and breaks, and obtain the required operational approval.

### 15. Operator posts to the wrong account

Create approved reversal and correction linked to the case with maker-checker separation and
complete evidence. Never delete or edit the original posting.

### 16. Primary fails during settlement

Fence the old primary, fail over, classify ambiguous commits by operation key, resume batches
without duplicate effect, reconcile positions, and verify RPO/RTO.

### 17. Region fails

Restore authority, identity, secrets, database, Kafka, batch, and external connectivity in tested
order. Verify ledger and reconciliation state before declaring recovery.

### 18. One tenant generates 80% of operations

Measure hot accounts/partitions and contention. Use quotas, isolation, balanced keys, or controlled
account ownership without breaking per-account invariants.

### 19. Signing key is compromised

Contain scoped use, rotate/revoke safely, preserve audit, identify affected operations, reconcile
value movement, and follow the owned security/compliance incident process.

### 20. Audit stream has a sequence gap

Treat completeness as suspect. Preserve producer, broker, and sink evidence, locate the missing
range, reconstruct only from authoritative records, and fix the silent-loss control gap.

## System-Design Prompts

- Wallet and peer-to-peer transfers with holds and limits.
- Card orchestration with provider failure and reconciliation.
- Multi-currency ledger with exchange-rate versioning.
- Settlement and end-of-day platform.
- Entitlement and maker-checker service.
- Immutable audit platform.
- Dispute and chargeback workflow.
- Two-year ledger replay without repeating external effects.

For each quantify volume, value, currencies, account skew, availability, consistency, RPO/RTO,
cutoffs, retention, security, and operator workflow before drawing services.

## Self-Assessment

| Score | Evidence |
|---:|---|
| 0 | names a tool or pattern only |
| 1 | explains happy path and basic components |
| 2 | defines invariant, failure window, trade-off and recovery |
| 3 | adds measurable capacity/SLOs, controls, evidence, containment and rejected alternatives |

You are ready when unfamiliar scenarios reach level 2 and major designs reach level 3 without
claiming impossible end-to-end exactly-once guarantees.

## Recommended Next

Return to [Financial Systems Architecture](./FINANCIAL-SYSTEMS-ARCHITECT-PATH.md), then use the
[Architecture Portfolio And Mock Interview Program](../../leadership/ARCHITECTURE-PORTFOLIO-MOCK-INTERVIEW-PROGRAM.md).

## Official References

- [PCI Security Standards Council](https://www.pcisecuritystandards.org/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
