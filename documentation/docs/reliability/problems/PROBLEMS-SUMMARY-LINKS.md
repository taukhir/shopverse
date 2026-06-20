---
title: Problems Summary And Links
---

# Problems Summary And Links

The summary table and related documentation links.

Back to [Shopverse Problems And Solutions](../PROBLEMS-AND-SOLUTIONS.md).

## Summary

| Category | Problem | Applied solution |
|---|---|---|
| Runtime | Checkout spans multiple service databases and Kafka | choreography SAGA with local transactions, outbox, compensation, and timeline |
| Security | A valid customer JWT could be used to guess another customer's resource identifier | owner-or-admin method security backed by service-local existence queries |
| Runtime | Checkout retry can create duplicate orders | mandatory `Idempotency-Key`, same-customer lookup, and database uniqueness |
| Runtime | Domain state can commit while the outgoing event is lost | transactional outbox inserted atomically with domain state |
| Runtime | Poison Kafka event can block business progress | retry topics, DLT persistence, and replay audit fields |
| Runtime | Outbox database lock held during Kafka wait | short claim and finalization transactions |
| Runtime | Worker crash strands a claimed Outbox event | timestamped claims and stale-claim recovery |
| Runtime | Inventory outage returned `404` | explicit `ServiceUnavailableException` mapped to `503` |
| Security | Services could run as container root | dedicated non-root `shopverse` user |
| Build | Parallel builds shared Gradle cache metadata | unique BuildKit cache ID per service |
| Build | JAR ownership changed in a later immutable layer | `COPY --chown` and targeted log-directory ownership |
| Build | Build tooling could remain in deployable images | separate JDK build and JRE runtime stages |
| Verification | Processes could run indefinitely | global deadline and process-tree termination |
| Verification | Windows web probe produced false failures | bounded `curl.exe` status and content checks |
| Verification | Config Server exported irrelevant test spans | zero sampling in isolated test Compose only |


## Related Documentation

- [Shopverse SAGA and Outbox implementation](../SAGA-OUTBOX.md)
- [Resource ownership authorization](runtime/RESOURCE-OWNERSHIP-AUTHORIZATION.md)
- [Transactional outbox pattern](../OUTBOX-PATTERN.md)
- [Inbox pattern](../INBOX-PATTERN.md)
- [Shopverse SAGA code flow](../SHOPVERSE-SAGA-CODE-FLOW.md)
- [Generic SAGA and Outbox patterns](../SAGA-GENERIC.md)
- [Spring and Kafka transactions](../TRANSACTIONS.md)
- [Spring Kafka](../../spring/SPRING-KAFKA.md)
- [API guide](../../development/API-GUIDE.md)
- [MDC and correlation tracing](../../observability/MDC-CORRELATION-TRACING.md)
- [Complete Shopverse demo](../../case-study/COMPLETE-DEMO.mdx)
- [Observability operations](../../observability/SHOPVERSE-OBSERVABILITY-OPERATIONS.md)
- [Docker guide](https://github.com/taukhir/shopverse/tree/main/docker)













