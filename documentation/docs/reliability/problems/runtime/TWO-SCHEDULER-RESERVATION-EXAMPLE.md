---
title: Two-Scheduler Reservation Expiry Example
---

# Two-Scheduler Reservation Expiry Example

This example shows two Inventory Service replicas competing for four expired
reservations. Both replicas may discover the same IDs, but the conditional
claim ensures that each reservation has only one owner.

## Initial State

Assume all reservations expired at `12:05:00`:

| ID | Order | Product | Quantity | Status |
|---:|---|---:|---:|---|
| 11 | `ORD-1001` | 101 | 1 | `RESERVED` |
| 12 | `ORD-1002` | 102 | 2 | `RESERVED` |
| 13 | `ORD-1003` | 103 | 1 | `RESERVED` |
| 14 | `ORD-1004` | 104 | 3 | `RESERVED` |

At `12:05:10`, Scheduler A and Scheduler B both execute:

```sql
SELECT id
FROM inventory_reservations
WHERE status = 'RESERVED'
  AND expires_at <= CURRENT_TIMESTAMP
ORDER BY expires_at, id
LIMIT 100;
```

Both can receive `[11, 12, 13, 14]`. Candidate discovery is intentionally not
the ownership decision.

## Atomic Claim

Each scheduler attempts one ID at a time:

```sql
UPDATE inventory_reservations
SET status = 'EXPIRING'
WHERE id = ?
  AND status = 'RESERVED'
  AND expires_at <= CURRENT_TIMESTAMP;
```

An update count of `1` means the replica owns the reservation. An update count
of `0` means another replica already claimed or completed it.

| Reservation | Scheduler A | Scheduler B | Owner |
|---:|---|---|---|
| 11 | update count `1` | update count `0` | A |
| 12 | update count `0` | update count `1` | B |
| 13 | update count `1` | update count `0` | A |
| 14 | update count `0` | update count `1` | B |

The exact distribution is nondeterministic. The invariant is that only one
conditional update can change a particular row from `RESERVED` to `EXPIRING`.

## Per-Reservation Transactions

Scheduler A processes 11 and 13; Scheduler B processes 12 and 14. Each owned
reservation uses its own transaction:

```text
begin
  verify status is EXPIRING
  return reserved quantity to inventory_items
  set reservation status to EXPIRED
  insert inventory.failed into outbox_events
commit
```

After all successful transactions:

| ID | Owner | Final status | Stock released | Outbox event |
|---:|---|---|---:|---|
| 11 | A | `EXPIRED` | 1 | one `inventory.failed` |
| 12 | B | `EXPIRED` | 2 | one `inventory.failed` |
| 13 | A | `EXPIRED` | 1 | one `inventory.failed` |
| 14 | B | `EXPIRED` | 3 | one `inventory.failed` |

## One Record Fails

Assume product 103 is missing while Scheduler A processes reservation 13:

```text
reservation 11 -> committed as EXPIRED
reservation 12 -> committed as EXPIRED
reservation 13 -> its transaction rolls back
reservation 14 -> committed as EXPIRED
```

Reservation 13 is isolated from the other three. Depending on the chosen
failure policy, it can return to `RESERVED`, move to `EXPIRY_FAILED`, or remain
claimable after a stale-claim timeout. The scheduler records a failure metric
and continues instead of rolling back the complete batch.

## Why Duplicate Discovery Is Safe

Two schedulers reading the same candidate list is acceptable because reading
does not grant ownership. Correctness comes from the database predicate:

```text
RESERVED --one successful conditional update--> EXPIRING
```

The design therefore avoids a long transaction around the scan and avoids
holding database locks while publishing Kafka records.

## Related Documentation

- [Reservation-expiry hub](MULTI-REPLICA-RESERVATION-EXPIRY.md)
- [Atomic claim implementation](ATOMIC-RESERVATION-CLAIM.md)
- [Late payment after expiry](LATE-PAYMENT-AFTER-EXPIRY.md)
- [Database locking and claims](../../locking/DATABASE-LOCKING-AND-CLAIMS.md)
