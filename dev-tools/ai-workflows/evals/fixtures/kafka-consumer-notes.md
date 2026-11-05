# Synthetic Consumer Configuration

- Broker delivery is at least once.
- Listener acknowledgment happens after `onInventoryReserved` returns.
- A crash can happen after provider capture but before acknowledgment.
- Two delivery threads can receive the same `eventId` concurrently.
- There is no unique database constraint for processed event identity.
- The payment provider supports a caller-supplied idempotency key.
- The smallest acceptable design must address both provider capture and local
  database effects; an in-memory set is not durable.
