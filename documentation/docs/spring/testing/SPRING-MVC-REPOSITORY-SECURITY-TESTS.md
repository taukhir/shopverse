---
title: Spring MVC Repository And Security Tests
---

# Spring MVC Repository And Security Tests

Controller tests, MockMvc, repository tests, Spring test annotations, context loading, and security tests.

Back to [Spring Boot Testing](../SPRING-BOOT-TESTING.md).

## Controller Tests

Controller tests verify:

- route and HTTP method;
- request binding;
- Jakarta Validation;
- response status and JSON;
- exception mapping;
- security rules where included;
- delegation to the service boundary.

### Standalone MockMvc

Shopverse User Service currently demonstrates:

```java
@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    UserService userService;

    MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(new UserController(userService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setValidator(validator)
                .build();
    }
}
```

Advantages:

- very fast;
- explicit controller/advice/validator setup;
- no application context.

Limitations:

- does not prove normal MVC auto-configuration;
- filters and security are absent unless explicitly added;
- mapper configuration can differ from the application.

### MVC Slice

Use a Spring MVC test slice when framework wiring matters:

```java
@WebMvcTest(UserController.class)
class UserControllerWebMvcTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    UserService userService;
}
```

`@WebMvcTest` loads MVC-related components rather than the entire application.
Use `@MockitoBean` to replace service collaborators in the Spring context.

Choose standalone setup for a narrow unit-style controller test and
`@WebMvcTest` for MVC configuration, converters, filters, or security behavior.


## MockMvc Example

```java
mockMvc.perform(post("/api/v1/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.username").value("ahmed"));

verify(userService).createUser(any(CreateUserRequest.class));
```

Invalid input:

```java
mockMvc.perform(post("/api/v1/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
        .andExpect(status().isBadRequest());

verify(userService, never()).createUser(any());
```


## Repository Tests

Use `@DataJpaTest` for:

- entity mappings;
- derived/custom queries;
- constraints;
- entity graphs and fetch behavior;
- optimistic locking;
- auditing when imported/configured;
- database-specific behavior when paired with the right database.

```java
@DataJpaTest
class OrderRepositoryTest {

    @Autowired
    OrderRepository repository;

    @Test
    void findsOrderByIdempotencyKey() {
        repository.saveAndFlush(order);

        assertThat(repository.findWithItemsByIdempotencyKey("checkout-1"))
                .isPresent();
    }
}
```

An H2 repository test is useful for generic JPA behavior but cannot prove every
MySQL detail. Use Testcontainers for dialect, locking, migration, index, and
constraint behavior that matters in production.

Tests managed by Spring may roll back automatically. Call `flush()` when the
test must surface a database constraint before the test ends.


## Spring Test Annotations

| Annotation | Use |
|---|---|
| `@SpringBootTest` | full application context |
| `@WebMvcTest` | MVC/controller slice |
| `@DataJpaTest` | JPA/repository slice |
| `@JsonTest` | JSON mapper and serialization slice |
| `@RestClientTest` | HTTP client slice |
| `@JdbcTest` | JDBC-focused slice |
| `@AutoConfigureMockMvc` | add MockMvc to a Boot test |
| `@ActiveProfiles` | select test profiles |
| `@TestPropertySource` | add test property sources |
| `@DynamicPropertySource` | register runtime-generated properties |
| `@Sql` | execute SQL before/after tests |
| `@DirtiesContext` | discard a modified cached context |
| `@Transactional` | run test in a test-managed transaction |
| `@MockitoBean` | replace a Spring bean with a Mockito mock |
| `@WithMockUser` | establish a mock security identity |

Use `@SpringBootTest` only when full wiring is the behavior being tested.
Application contexts are cached between compatible tests, but differing
properties or `@DirtiesContext` reduce reuse and increase runtime.


## Context Load Tests

```java
@SpringBootTest(properties = {
        "spring.cloud.config.enabled=false",
        "eureka.client.enabled=false"
})
class ApplicationTests {

    @Test
    void contextLoads() {
    }
}
```

This proves that a configured context can start. It does not prove business
behavior and should not be the majority of the suite.

Disable or replace external dependencies deliberately. Do not let a context
test accidentally call Config Server, Eureka, JWKS, Kafka, or a real database.


## Security Tests

Spring Security test support:

```java
@Test
@WithMockUser(username = "alice", roles = "CUSTOMER")
void ownerCanReadTimeline() {
    assertThatNoException()
            .isThrownBy(() -> controller.getTimeline(orderId));
}
```

Required authorization scenarios:

- owner allowed;
- different customer denied;
- administrator allowed;
- missing authentication denied;
- invalid/expired token denied at resource-server boundary;
- authority/claim mapping tested separately.

Direct method tests prove method-security proxies only when the tested bean is
obtained from a Spring context. Calling `new Controller(...)` bypasses those
proxies.







