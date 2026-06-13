# Code Cross-Check

This audit covers controllers, security configuration, services, repositories,
Liquibase, Logback, Kafka listeners, cloud configuration, Docker Compose,
Promtail, Prometheus, Grafana provisioning, tests, and documentation. The
repository received static validation and Compose model validation; no complete
Docker, Testcontainers, or end-to-end verification was performed.

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
- Gateway, Auth, User, Order, Inventory, and Payment validate JWT timestamps
  and issuer `shopverse-auth-service`.
- JSON logs, correlation MDC, Promtail, Loki, Prometheus, Grafana, and Zipkin are configured.
- Testcontainers integration-test support exists for the SAGA services.

## Gaps And Hardening Items

1. **OpenTelemetry is not explicitly configured.** Builds use the Spring Boot Zipkin starter and Prometheus registry. Do not claim a dedicated OpenTelemetry SDK/exporter deployment until it is added.
2. **Health-log separation is partial.** User, Order, Inventory, and Payment use dedicated health files. Auth, Gateway, Config, and Discovery do not.
3. **User public health is not on a static gateway route.** The gateway routes User CRUD paths, not `/api/v1/public/**`; use direct port `8082` unless a route is added.
4. **Outbox retry has no terminal policy.** Failed rows remain `PENDING` and are retried on every scheduler pass. Add backoff, `next_attempt_at`, maximum attempts, and a terminal `FAILED` state to bound load during a prolonged Kafka outage.
5. **DLT deduplication is application-only.** The existence check prevents common duplicates, but concurrent handlers have no supporting database unique key or event ID.
6. **Consumer idempotency is state-based.** Duplicate delivery can still append
   repeated timeline or outgoing outbox events in some SAGA paths. A
   processed-event/inbox table keyed by event ID would provide a stronger
   guarantee.
7. **Concurrent checkout duplicates use a database constraint as the final
   guard.** Two simultaneous requests can both miss the initial lookup; one can
   receive a constraint exception instead of the already-created order.
8. **Error responses are not one cross-service contract.** Standardize code, status, message, path, timestamp, and correlation ID.
9. **Ownership policy is not expressed uniformly.** Timeline and Payment use `@PreAuthorize`; order detail performs an inline controller check.
10. **Caching is local only.** Invalidation is not coordinated across replicas.
11. **Development RSA keys are tracked.** They are acceptable only as disposable
    POC keys. Production keys must come from a secret store and must never be
    committed.
12. **User method-security coverage is incomplete.** Standalone controller
    tests validate mappings and request validation but do not load the Spring
    Security filter chain. Add focused `@PreAuthorize` allow/deny tests for
    `USER_READ`, `USER_CREATE`, `USER_UPDATE`, `USER_DELETE`, and
    `ADMIN_ACCESS`.

## Static Validation Results

- all local Markdown links resolve;
- Markdown code fences are balanced;
- Logback XML and Grafana dashboard JSON parse successfully;
- Java package declarations match source paths;
- no exact duplicate dependency declarations were found;
- no `TODO`, `FIXME`, mojibake, `System.out`, or `printStackTrace` remains in
  Java or Markdown sources;
- the merged development/test Compose model is valid;
- API Gateway tests passed during the audit before the final comment-only
  cleanup;
- Order, Inventory, and Payment unit suites pass;
- Order, Inventory, and Payment MySQL/Kafka Testcontainers suites pass,
  including the `claimed_at` migrations;
- the complete Docker runtime was not started for this isolated change.

## Documentation Decisions

- Redis, a full OAuth2 Authorization Server, AI operations, and the full failure console are marked planned.
- Kafka is described as at-least-once, not exactly-once.
- compensation is a new transaction, not a distributed rollback.
- correlation ID and trace ID are documented as different identifiers.
- service READMEs contain local contracts; reusable explanations live under `docs/`.
