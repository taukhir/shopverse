# Code Cross-Check

This is a static documentation audit of controllers, security configuration, services, repositories, Liquibase, Logback, Kafka listeners, cloud configuration, Docker Compose, Promtail, Prometheus, and Grafana provisioning. No build, test, container, or runtime verification was performed.

## Confirmed

- Order, Inventory, Payment, and User own separate MySQL schemas.
- Liquibase runs with Hibernate validation and `open-in-view=false`.
- checkout requires validation and an idempotency key.
- Order, Inventory, and Payment persist domain state and outgoing outbox state in one transaction.
- Kafka producer acknowledgement and idempotence settings are configured.
- SAGA consumers use `@KafkaListener`, `@RetryableTopic`, and DLT handlers.
- unresolved DLT records are deduplicated in service logic and contain replay audit fields.
- Inventory uses optimistic locking and expiring reservations.
- Order timeline and Payment lookup have owner-or-admin method authorization.
- User entity graphs address roles/permissions N+1 loading.
- Resilience4j is annotation-based and centrally configured.
- JSON logs, correlation MDC, Promtail, Loki, Prometheus, Grafana, and Zipkin are configured.
- Testcontainers integration-test support exists for the SAGA services.

## Gaps And Hardening Items

1. **Issuer validation is inconsistent.** User Service explicitly validates `shopverse-auth-service`; Gateway, Order, Inventory, and Payment use `jwk-set-uri` without an explicit issuer validator.
2. **OpenTelemetry is not explicitly configured.** Builds use the Spring Boot Zipkin starter and Prometheus registry. Do not claim a dedicated OpenTelemetry SDK/exporter deployment until it is added.
3. **Health-log separation is partial.** User, Order, Inventory, and Payment use dedicated health files. Auth, Gateway, Config, and Discovery do not.
4. **User public health is not on a static gateway route.** The gateway routes User CRUD paths, not `/api/v1/public/**`; use direct port `8082` unless a route is added.
5. **Outbox retry has no terminal policy.** Failed rows remain `PENDING` and are retried on every scheduler pass. Add backoff, `next_attempt_at`, maximum attempts, and a terminal `FAILED` state to bound load during a prolonged Kafka outage.
6. **DLT deduplication is application-only.** The existence check prevents common duplicates, but concurrent handlers have no supporting database unique key or event ID.
7. **Consumer idempotency is state-based.** A processed-event/inbox table would provide a stronger event-ID guarantee.
8. **Error responses are not one cross-service contract.** Standardize code, status, message, path, timestamp, and correlation ID.
9. **Ownership policy is not expressed uniformly.** Timeline and Payment use `@PreAuthorize`; order detail performs an inline controller check.
10. **Caching is local only.** Invalidation is not coordinated across replicas.

## Documentation Decisions

- Redis, a full OAuth2 Authorization Server, AI operations, and the full failure console are marked planned.
- Kafka is described as at-least-once, not exactly-once.
- compensation is a new transaction, not a distributed rollback.
- correlation ID and trace ID are documented as different identifiers.
- service READMEs contain local contracts; reusable explanations live under `docs/`.
