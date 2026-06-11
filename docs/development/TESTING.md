# Testing Strategy

## Verification Levels

| Mode | Purpose | Target |
|---|---|---|
| Quick | Changed-service compile and unit tests | under 1 minute |
| Integration | MySQL/Kafka/Testcontainers tests | 2-5 minutes |
| Full | Docker SAGA, security, replay, and observability | under 10 minutes |

Every mode must have explicit timeouts and cleanup. A failed dependency should stop the run rather than leave polling loops active for hours.

## Unit Tests

Use JUnit 5 and Mockito for isolated service logic:

```java
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {
    @Mock OrderRepository repository;
    @InjectMocks OrderServiceImpl service;
}
```

Common lifecycle annotations:

- `@BeforeAll`/`@AfterAll`: once per class;
- `@BeforeEach`/`@AfterEach`: around every test;
- `@Test`: one behavior;
- `@ParameterizedTest`: the same rule with several inputs.

## Controller Tests

Use `@WebMvcTest` for request mapping, validation, serialization, security, and status codes. Mock the service boundary with `@MockitoBean`.

Method-security tests should cover:

- owner allowed;
- different customer denied;
- administrator allowed;
- missing/invalid token denied.

## Repository Tests

Use `@DataJpaTest` for mappings, constraints, entity graphs, and custom queries. Test database uniqueness and optimistic version behavior directly.

## Integration Tests

Shopverse has reusable Testcontainers support for MySQL and Kafka. Integration tests verify:

- Liquibase migration and schema compatibility;
- transaction commit and rollback;
- outbox persistence and publication;
- Kafka event consumption;
- DLT persistence and replay audit;
- idempotency and duplicate requests.

```java
@Testcontainers
@SpringBootTest
class OutboxIntegrationTest {
    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.4");

    @Container
    static KafkaContainer kafka = new KafkaContainer(...);
}
```

Reuse containers within a test JVM and avoid starting the full Compose stack for repository or event integration tests.

## End-To-End Tests

Full verification should:

1. start infrastructure and services with health timeouts;
2. apply and inspect migrations;
3. authenticate;
4. execute checkout;
5. poll bounded SAGA state;
6. verify outbox rows in all owning schemas;
7. verify ownership allowed/denied behavior;
8. verify DLT and replay audit;
9. verify Prometheus, Loki, Zipkin, and Grafana;
10. collect diagnostics and shut down on failure.

## Fast Feedback Rules

- build only changed services;
- separate unit, integration, and E2E tasks;
- cache Gradle dependencies;
- use Docker health checks instead of fixed sleeps;
- use bounded polling with a clear deadline;
- gather container logs only for failed services;
- never rebuild observability infrastructure for a Java-only change;
- stop on the first infrastructure prerequisite failure.

## Commands

Use the scripts under the repository-root `scripts/` directory and the detailed operational instructions in [testing/README.md](../../testing/README.md). Do not use Full mode as the default developer loop.
