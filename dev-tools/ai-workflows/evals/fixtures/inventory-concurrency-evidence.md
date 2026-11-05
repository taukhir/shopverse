# Synthetic inventory evidence

- Product `SKU-7` has one available unit and uses an optimistic-lock version.
- Two orders concurrently read the same version and attempt reservation.
- Two service replicas run the expiry query without a claim or lease.
- Release is keyed by order number, but the test uses only one in-memory instance.
- Required invariant: available stock and active reservations must never oversell
  physical stock, including retry, expiry, and replay.
