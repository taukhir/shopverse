---
title: Spring Security Messaging And Testing Annotations
description: Important Spring method-security, Kafka listener/retry, event, Boot testing, test-slice, mock, profile, SQL, Testcontainers, and dynamic-property annotations with runtime and test-boundary explanations.
difficulty: Advanced
page_type: Deep Dive
status: maintained
prerequisites: [Spring Security, Spring Kafka, Spring Boot testing]
learning_objectives: [Use method security correctly, Explain listener annotations, Select test scopes, Avoid context-cache and mock traps, Prove integration behavior]
technologies: [Spring Security, Spring Kafka, Spring Boot Test, JUnit 5, Testcontainers]
last_reviewed: "2026-07-29"
scope: generic
owner: docs-spring
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Spring Security Messaging And Testing Annotations

## Security Annotations

| Annotation | Role |
|---|---|
| `@EnableMethodSecurity` | enables supported method-authorization advisors |
| `@PreAuthorize` | authorization expression before invocation |
| `@PostAuthorize` | checks returned object/result after invocation; side effect may already have happened |
| `@PreFilter` / `@PostFilter` | filters supported collections before/after method; can hide inefficient data access |
| `@AuthenticationPrincipal` | resolves principal into a web-handler argument |
| `@WithMockUser` | builds a test security context; does not prove real token decoding/filter behavior |

Method security is defense in depth and domain authorization. Put it on managed service
boundaries with stable expressions/authorization components. Self-invocation and objects
created outside Spring can bypass proxy-based method security.

Avoid `@PostAuthorize` for irreversible actions: authorization happens after the method.

## Kafka And Messaging Annotations

| Annotation | Effect |
|---|---|
| `@KafkaListener` | registers a listener endpoint/container for topics, patterns or assigned partitions |
| `@KafkaHandler` | selects a handler method in a class-level multi-method listener |
| `@RetryableTopic` | creates/configures non-blocking retry-topic topology |
| `@DltHandler` | handles records routed to the retry-topic DLT path |
| `@SendTo` | sends listener return value to a configured destination |
| `@EnableKafka` | enables Kafka listener annotation detection when not supplied by Boot configuration |

Listener annotations do not guarantee exactly-once business effects. Offset commits,
transactions, retry/DLT ordering, idempotency and external side effects still need design.
Non-blocking retries can change per-key ordering.

## Boot Test Scope

| Annotation | Context scope |
|---|---|
| `@SpringBootTest` | full Boot application context; web environment is configurable |
| `@WebMvcTest` | MVC/controller slice, not repositories/services unless imported/mocked |
| `@DataJpaTest` | JPA repository/entity slice, commonly transactional test behavior |
| `@JdbcTest` | JDBC-focused slice |
| `@JsonTest` | JSON mapper/converter slice |
| `@RestClientTest` | REST client slice with focused HTTP mocking infrastructure |
| `@AutoConfigureMockMvc` | configures MockMvc, often with full Boot test |
| `@TestConfiguration` | additional test-only configuration without replacing primary application config |

Choose the smallest context that proves the boundary. Do not combine multiple slice
annotations; use one slice plus selected auto-configuration/imports or a full integration
test when the combined boundary matters.

## Test Replacement And Inputs

- `@MockitoBean` replaces/adds a Mockito mock in the application context;
- `@MockitoSpyBean` wraps an existing bean with a spy;
- `@DynamicPropertySource` contributes dynamic values such as container endpoints;
- `@ServiceConnection` connects supported testcontainers to Boot connection details;
- `@ActiveProfiles` activates test profiles;
- `@TestPropertySource` supplies test-specific properties;
- `@Sql` runs scripts around test methods/classes;
- `@DirtiesContext` removes a context from the cache—use sparingly because it slows suites;
- `@Transactional` on tests can roll back test changes but may not model real commit behavior.

Mocking a bean changes the context cache key. Excess unique mock/property combinations can
create many expensive contexts.

## JUnit Annotations Worth Knowing

`@Test`, `@ParameterizedTest`, `@ValueSource`, `@CsvSource`, `@MethodSource`, `@EnumSource`,
`@BeforeEach`, `@AfterEach`, `@BeforeAll`, `@AfterAll`, `@Nested`, `@DisplayName`, `@Tag`,
`@Timeout`, `@Disabled`, `@TestInstance` and `@ExtendWith`.

SpringExtension integrates the TestContext framework. Boot test annotations already compose
the required extension; adding it redundantly is unnecessary.

## Interview Questions

**Does `@WithMockUser` prove JWT validation?** No. It installs a test authentication. Use a
security-filter/resource-server test with representative signed/decoded token behavior for
that contract.

**`@WebMvcTest` versus `@SpringBootTest`?** The former is a focused MVC slice; the latter
builds the Boot application context and can start/mock a web environment.

**Why can transactional repository tests pass while production fails?** Test rollback and
one transaction can hide detached/lazy access, commit constraints, after-commit events and
real concurrent transactions.

## Official References

- [Spring Security method security](https://docs.spring.io/spring-security/reference/servlet/authorization/method-security.html)
- [Spring Kafka receiving messages](https://docs.spring.io/spring-kafka/reference/kafka/receiving-messages/listener-annotation.html)
- [Testing Spring Boot applications](https://docs.spring.io/spring-boot/reference/testing/spring-boot-applications.html)

