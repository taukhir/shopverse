---
title: Money, Ledger, And Accounting Invariants
description: Model currency and rounding safely and implement append-only, balanced ledger transactions, postings, reversals, and balance projections.
difficulty: Advanced
page_type: Guide
status: maintained
prerequisites: [Java value objects, SQL transactions, domain modeling]
technologies: [Java, BigDecimal, PostgreSQL, Spring Data JPA]
last_reviewed: "2026-07-28"
scope: generic
owner: docs-architecture
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Money, Ledger, And Accounting Invariants

## Money Is Amount Plus Currency And Policy

`10.00 USD` and `10 JPY` are not interchangeable numbers. A safe model carries currency and
validates the scale, precision, range, and rounding required at the business boundary. Do not use
`double` for authoritative monetary arithmetic.

Two common storage models are integer minor units plus currency, when the supported asset's
exponent and range are governed, and fixed-precision decimal plus currency when fractional
requirements vary. Neither removes the need for currency metadata, explicit rounding points,
overflow checks, and versioned policy. Do not assume every currency has two decimal places.

```java
public record Money(BigDecimal amount, Currency currency) {
    public Money {
        Objects.requireNonNull(amount);
        Objects.requireNonNull(currency);
        amount = amount.setScale(
                currency.getDefaultFractionDigits(),
                RoundingMode.UNNECESSARY
        );
    }

    public Money add(Money other) {
        if (!currency.equals(other.currency)) {
            throw new IllegalArgumentException("Currency mismatch");
        }
        return new Money(amount.add(other.amount), currency);
    }
}
```

`UNNECESSARY` rejects accidental rounding. At an approved conversion, fee, tax, or allocation
boundary, select and record the mandated rounding rule. Construct decimal values from strings or
exact integer forms, not binary floating-point inputs.

## Double-Entry Ledger Model

```text
ledger transaction
  +-- posting: account A, debit  100 USD
  +-- posting: account B, credit 100 USD

sum(debits) == sum(credits) for the transaction and currency/accounting scope
```

Debit and credit are accounting directions, not universal synonyms for plus and minus. The account
type and approved chart determine their balance effect.

| Object | Responsibility |
|---|---|
| account | stable identity, currency/asset, type, status, ownership and product links |
| ledger transaction | atomic posting group, operation identity, dates, description and status |
| posting | one debit/credit movement on one account |
| reference | link to payment, transfer, settlement, reversal or adjustment |
| balance projection | rebuildable current/dated aggregate derived from postings |

## Relational Shape

```sql
CREATE TABLE ledger_transaction (
    id               UUID PRIMARY KEY,
    operation_key    VARCHAR(100) NOT NULL UNIQUE,
    transaction_type VARCHAR(50) NOT NULL,
    business_date    DATE NOT NULL,
    effective_at     TIMESTAMPTZ NOT NULL,
    recorded_at      TIMESTAMPTZ NOT NULL,
    reverses_id      UUID NULL REFERENCES ledger_transaction(id),
    rule_version     VARCHAR(40) NOT NULL
);

CREATE TABLE ledger_posting (
    id              UUID PRIMARY KEY,
    transaction_id  UUID NOT NULL REFERENCES ledger_transaction(id),
    account_id      UUID NOT NULL,
    direction       VARCHAR(6) NOT NULL CHECK (direction IN ('DEBIT', 'CREDIT')),
    amount          NUMERIC(38, 12) NOT NULL CHECK (amount > 0),
    currency        CHAR(3) NOT NULL,
    sequence_no     INTEGER NOT NULL,
    UNIQUE (transaction_id, sequence_no)
);
```

The schema cannot express every balancing rule. Build and validate the complete posting set, then
insert the transaction and postings atomically. Add constraints or a controlled posting procedure
where feasible, and test concurrency on the real database engine.

## Atomic Posting Boundary

```java
@Transactional
public LedgerTransactionId post(PostCommand command) {
    LedgerTransaction existing = repository.findByOperationKey(command.operationKey());
    if (existing != null) {
        return requireEquivalent(existing, command).id();
    }

    PostingPlan plan = rules.forVersion(command.ruleVersion()).createPlan(command);
    plan.requireBalanced();
    plan.requireSupportedCurrencies();

    try {
        return repository.insertTransactionAndPostings(plan);
    } catch (DataIntegrityViolationException duplicate) {
        return repository.requireByOperationKey(command.operationKey()).id();
    }
}
```

The unique constraint closes the concurrent check/insert race. Reusing an idempotency key with a
different command must be rejected, not treated as success.

## Posted History, Reversal, And Adjustment

Do not update or delete a posted transaction to hide an error. Create a linked reversal whose
postings negate the original according to approved rules, then create a corrected transaction if
required. Preserve original and correction identities, reason, actor, approval, timestamps, and
rule version.

```text
T100 original posting
T101 reverses T100
T102 corrected posting (references the correction case)
```

Whether an operation can be reversed, voided, refunded, or adjusted depends on its stage and
external rules. These terms are not interchangeable.

## Balance Models

Define ledger/booked, available, pending, reserved/held, and value-dated balances explicitly.
A cache or projection improves read speed but must be rebuildable and checked against postings.

- Calculate from postings: simple authority, expensive at scale.
- Update balance rows with postings: fast reads, hot-row and concurrency concerns.
- Project committed events: scalable reads, expected lag and repair needs.
- Use dated snapshots plus later postings: efficient history with controlled close.

Never let an eventually consistent projection become the only control preventing an overdraft or
double spend unless the product explicitly accepts that risk.

## Concurrency

Two simultaneous withdrawals can both observe sufficient funds. Protect the invariant with a
conditional update (`available >= amount`), optimistic version, pessimistic lock with consistent
order, single-writer ownership, or a hold recorded in the same authoritative boundary.

The choice depends on throughput, contention, overdraft rules, cross-account atomicity, and
recovery. Kafka ordering helps one keyed stream; it does not stop another database writer.

## Temporal Semantics

Record event time, processing/recorded time, effective/value date, business date, and external
settlement date separately. Time zones, holidays, cutoffs, late events, and backdated adjustments
must be product rules rather than inferred timestamps.

## Failure And Verification

Test duplicate commands, same key/different payload, concurrent debits, partial rollback, reversal
twice, unsupported currency/scale, overflow, rule-version changes, projection lag, replay, restore,
and a crash after commit before response.

Monitor unbalanced attempts, duplicate-key conflicts, posting latency, hot accounts, projection
lag, limit violations, reversals, manual adjustments, and reconciliation breaks.

## Official References

- [Java `BigDecimal`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/BigDecimal.html)
- [Java `Currency`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Currency.html)
- [PostgreSQL numeric types](https://www.postgresql.org/docs/current/datatype-numeric.html)

## Recommended Next

Continue with [Payment Lifecycle, Idempotency, And Uncertain Outcomes](./PAYMENT-LIFECYCLE-IDEMPOTENCY.md).

