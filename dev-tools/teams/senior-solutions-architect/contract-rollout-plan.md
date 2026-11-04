# FEAT-E / FEAT-L implementation proposal

2026-10-30. Proposed sequence, not an approved deployment plan or completed implementation.

## Outcome

Service-owned REST contracts and Kafka schemas generate reusable transport types, detect incompatible changes in CI, and preserve checkout, ownership, outbox atomicity, retries, and recovery.

## Evidence and constraints

- Existing drafts: ../tauqeer/task/order-contract-design/.
- Agreed module direction: ../sprints/sprint-0001/discussion-05.md.
- ../../../shopverse-platform/settings.gradle does not yet include either proposed contract module.
- ShopverseOutboxPublishWorker in the platform outbox starter uses KafkaTemplate<String, String> and publishes message.payload(). Avro requires an explicit publishing boundary change.
- OrderSagaListener accepts String payloads and parses with KafkaEventParser; it also uses retry topics and DLT handling. Migration includes these paths, not just main listeners.
- services/order-service/build.gradle already includes springdoc. Generated documentation alone is not contract enforcement.
- Platform AGENTS.md currently keeps event records in owning services. Before adding generated event artifacts there, explicitly reconcile that guidance with the recorded service-owned schema-module decision. Keep business/domain types in their services.

## Proposed sequence

1. Inventory REST operations, DTOs, events, producers, consumers, topic keys, outbox storage, retries, DLT and replay. Capture current behavior and explicit acceptance criteria. Keep the BUG-001 multi-item behavior change separately tracked.
2. Formalize complete OpenAPI documents per service (paths, authentication, request/response schemas, validation, errors and idempotency headers where applicable). Create shopverse-contracts with per-service namespaces. Generate transport DTOs and optionally API interfaces; map them to service-owned domain objects. Prove generator compatibility with the actual Spring/Jakarta build before wider adoption.
3. Create shopverse-avro-schemas with service-owned .avsc files and generated Java records. Define event identity, money, timestamps, correlation and key conventions. Schema defaults must reflect meaningful evolution semantics. Event IDs alone do not implement deduplication.
4. Select and pin a compatible registry/serializer stack. Proposed starting point: Confluent-compatible Schema Registry and BACKWARD_TRANSITIVE with consumer-first evolution. Document subject naming, schema registration, failure behavior and rollback constraints. Revisit FULL_TRANSITIVE if older consumers must read new messages. JSON-to-Avro is a wire-format migration outside Avro schema compatibility guarantees.
5. Pilot one event route and one REST operation. Preserve transactionally stored event intent; introduce a version-aware outbox encoding boundary. Keep old pending outbox records readable. Preserve stable IDs across retries. Cover binary deserialization failures, raw payload retention, DLT and replay with schema references and key/header preservation.
6. Prefer a controlled new-topic cutover for JSON-to-Avro, with explicit drain/routing rules for in-flight orders. Avoid two active business-processing paths for the same event. Validate duplicate handling, compensation, ordering and rollback before extending across the choreography.
7. Add CI schema compatibility and REST drift/breaking-change checks, generation/build checks, and real Kafka/registry integration tests. Validate checkout success, inventory rejection, payment failure, duplicates, registry outage and recovery. Roll out only after migration and rollback evidence is reviewable.

## First deliverable

Contract inventory and finalized Order API/event proposal, including producer/consumer impact and acceptance criteria. Do not treat the draft line-item schema as a completed BUG-001 fix.

## References

- https://avro.apache.org/docs/1.12.0/specification/
- https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html
- https://openapi-generator.tech/docs/generators/spring/
