# Order contract implementation review

2026-11-05, Asia/Calcutta. Requested by Tauqeer. Review only; application implementation remains user-led.

## Outcome

REST DTO generation and MapStruct integration compile and existing Order unit tests pass. Avro schema generation compiles, but Kafka runtime adoption is incomplete. This is a working contract foundation, not completion of the event migration or Discussion 07 target design.

## Findings and follow-up

1. **High — Avro runtime path remains JSON.** OrderServiceImpl.java:19,105 imports/constructs the service-local scalar OrderCreatedEvent; OutboxService.java:34 persists ObjectMapper JSON; ShopverseOutboxPublishWorker.java:42 sends the stored String. InventorySagaListener.java:30-31 receives String and parses its local JSON record. The new schema instead contains eventId, occurredAt, currency, totalAmount and an items array. Dependency inclusion does not adopt this transport. Smallest next step: agree a bounded Order-created migration design covering writer/reader, existing outbox rows, serializer/schema resolution, retry/DLT/replay, duplicate handling and rollback before changing the wire format. Prove it with a real producer/outbox/consumer integration test. Other saga event schemas have not been added to the schema module.

2. **Medium — REST boundary lacks regression evidence.** shopverse-contracts/build.gradle:23 generates models only; controllers do not implement generated API interfaces. OrderOwnershipAuthorizationTest mocks OrderContractMapper, and the reviewed test sources contain no actual mapper or HTTP contract validation tests. Existing service tests bypass this transport boundary. Add focused proof for nested request validation, one-item restriction, invalid/blank idempotency headers, mapped nested response values, money and timestamps; validate route/status/response agreement with the spec. Model generation alone cannot catch controller route/status drift.

3. **Low — Avro plugin configuration cache is still discarded.** The test command succeeds, but reports six cache serialization problems (five unique) from configureCopyExternalAvroResources. The existing notCompatibleWithConfigurationCache declaration in shopverse-avro-schemas/build.gradle does not make the cache reusable in this run. Separate build hygiene follow-up; not a failed schema compilation.

## Verified strengths

- openApiValidate reports a valid spec; OpenAPI and Avro generated Java compile.
- OrderContractMapper uses Spring component generation and ReportingPolicy.ERROR; generated mappings preserve nested objects, BigDecimal and Instant values by inspection.
- Controller uses generated request/response models and maps to service-owned application DTOs.
- Checkout contract retains maxItems=1 and nested validation, matching the current scalar event limitation; BUG-001 remains separate.
- Checkout still records state, timeline and outbox intent under its local transaction; no direct Kafka publication was introduced by these contracts.
- SecurityConfig retains ordered admin matchers and service ownership guards remain present. This was not a complete security audit.

## Validation and limits

Executed from services/order-service: `.\gradlew.bat test --no-daemon --max-workers=2`; BUILD SUCCESSFUL. This also executed OpenAPI validation/generation, Avro generation and compilation, main/test compilation and unit tests. Gradle cache serialization warnings remain. Integration tests, live HTTP, real Kafka/schema registry, schema evolution compatibility and cross-service rollout were not tested. No production code, schemas, dependencies or wrappers changed by this review. Existing unrelated working-tree changes preserved; only architect memory updated.
