---
title: Database LLD And Design Process
---

# Database LLD And Design Process

Database LLD, design process, interview approach, do and do not rules, and related guides.

Back to [HLD And LLD](../HLD-LLD.md).

## Database LLD

```text
orders
  id PK
  order_number UNIQUE
  idempotency_key UNIQUE
  customer_username
  status
  version
  created_at

order_items
  id PK
  order_id FK -> orders.id
  product_id
  quantity
  unit_price

outbox_events
  id PK
  aggregate_id
  event_type
  payload
  status
  next_attempt_at
```

Document indexes from query patterns, not only entity fields.


## Design Process

1. Clarify requirements and scale.
2. Define invariants and failure expectations.
3. Choose domain boundaries and data ownership.
4. Draw the HLD and evaluate trade-offs.
5. Select one critical flow.
6. define APIs, state, schema, and events.
7. draw LLD class and sequence diagrams.
8. identify concurrency, security, and recovery behavior.
9. define test strategy and operational signals.
10. review alternatives and record decisions.


## Interview Approach

For a system-design interview:

1. ask clarifying questions;
2. state assumptions;
3. estimate traffic and storage;
4. present a simple design first;
5. identify bottlenecks;
6. evolve the design for scale and failures;
7. discuss consistency, security, and observability;
8. summarize trade-offs.

For LLD:

1. identify actors and use cases;
2. model entities and state;
3. define interfaces and responsibilities;
4. apply patterns only where needed;
5. show extensibility and testability;
6. discuss edge cases and concurrency.


## Do And Do Not

| Do | Do not |
|---|---|
| Tie architecture to requirements | Start by drawing many services |
| State assumptions and numbers | Claim unlimited scale |
| Show data ownership | Share databases casually |
| Model failures and recovery | Draw only the happy path |
| Keep HLD technology-aware but implementation-light | Put every class in HLD |
| Make LLD precise enough to implement | Repeat broad architecture in LLD |
| Record trade-offs | Present one choice as universally best |
| Include security and observability | Treat them as later additions |


## Related Guides

- [System Design](../SYSTEM-DESIGN.md)
- [Microservice Architecture](../MICROSERVICES-GENERIC.md)
- [Java Design Patterns](../../development/DESIGN-PATTERNS.md)
- [Database Engineering](../../data/DATABASE-ENGINEERING.md)




