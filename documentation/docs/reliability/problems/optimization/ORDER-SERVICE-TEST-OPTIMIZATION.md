---
title: Optimize Order Service Tests
---

# Optimize Order Service Tests

Back to [Optimization Solutions](../OPTIMIZATION-SOLUTIONS.md).

## Status

Implemented.

Changed files:

- deleted `order-service/src/test/java/io/shopverse/order/OrderServiceApplicationTests.java`
- rewrote `order-service/src/test/java/io/shopverse/order/security/OrderOwnershipAuthorizationTest.java`

Verification:

```powershell
cd order-service
.\gradlew.bat test --no-daemon --rerun-tasks
.\gradlew.bat test --no-daemon --quiet
```

Result:

| Measurement | Before | After |
|---|---:|---:|
| `order-service` warm `test` task | 144.81s | 13.07s |
| `OrderServiceApplicationTests` | 73.563s | removed |
| `OrderOwnershipAuthorizationTest` | 54.592s | 5.08s |

Time saved:

| Scope | Saved |
|---|---:|
| Whole `order-service` test task | 131.74s faster |
| Whole `order-service` test task percentage | about 91% faster |
| Removed empty context test | 73.563s removed |
| Ownership authorization test | 49.512s faster |

The ownership authorization behavior is still covered:

- owner can read timeline
- another customer cannot read timeline
- admin can read any timeline

## Problem

`order-service` is the slowest test suite in the baseline.

Measured command:

```powershell
.\gradlew.bat test --quiet
```

Measured result:

| Test class | Time |
|---|---:|
| `OrderServiceApplicationTests` | 73.563s |
| `OrderOwnershipAuthorizationTest` | 54.592s |
| `ApiExceptionHandlerTest` | 0.156s |
| `CatalogServiceTest` | 0.123s |
| `OutboxEventTest` | 0.015s |

Total service test time:

```text
order-service,test,144.81,0
```

The slow tests are full `@SpringBootTest` contexts.

## How We Identified The Bottleneck

First, we measured the full service test time during the optimization baseline.

Command:

```powershell
$sw=[Diagnostics.Stopwatch]::StartNew()
.\gradlew.bat test --quiet
$code=$LASTEXITCODE
$sw.Stop()
"order-service,test,$([math]::Round($sw.Elapsed.TotalSeconds,2)),$code"
```

Result:

```text
order-service,test,144.81,0
```

Then we inspected Gradle's JUnit XML result files to find the slowest test
classes.

Command:

```powershell
Get-ChildItem order-service\build\test-results\test -Filter "*.xml" |
  ForEach-Object {
    [xml]$x = Get-Content $_.FullName
    $suite=$x.testsuite
    [pscustomobject]@{
      File=$_.Name
      Tests=[int]$suite.tests
      Failures=[int]$suite.failures
      Time=[double]$suite.time
    }
  } |
  Sort-Object Time -Descending |
  Select-Object -First 20
```

Result:

| Test class | Tests | Time |
|---|---:|---:|
| `OrderServiceApplicationTests` | 1 | 73.563s |
| `OrderOwnershipAuthorizationTest` | 3 | 54.592s |
| `ApiExceptionHandlerTest` | 1 | 0.156s |
| `CatalogServiceTest` | 1 | 0.123s |
| `OutboxEventTest` | 2 | 0.015s |

The diagnosis was clear:

- two test classes consumed almost all `order-service` test time
- both slow classes used full Spring application context startup
- one of them was an empty `contextLoads()` smoke test
- the other started JPA, Liquibase, Kafka, Eureka, Config Server-related auto-configuration, and method security to test only one ownership rule

That made this a test-scope problem, not a production code problem.

## Target Solution

Reduce the number and cost of full Spring contexts.

Work in this order:

1. Remove or narrow empty context tests.
2. Convert authorization tests to a smaller method-security or MVC-focused test.
3. Share identical test properties so Spring can reuse cached contexts.
4. Disable infrastructure not required by unit or slice tests.

## Step 1: Review Empty Context Test

Previous shape:

```java
@SpringBootTest(properties = {
        "eureka.client.enabled=false",
        "spring.cloud.config.enabled=false",
        "management.tracing.enabled=false",
        "spring.datasource.url=jdbc:h2:mem:orders;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.kafka.listener.auto-startup=false",
        "security.jwt.issuer=shopverse-auth-service"
})
class OrderServiceApplicationTests {

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @Test
    void contextLoads() {
    }
}
```

Implemented decision:

- deleted the empty `OrderServiceApplicationTests`
- did not keep a full-context smoke test in the unit test suite
- retained behavior-focused tests that assert real service rules

Why:

- the test had no assertions
- it paid for a full application context
- it overlapped with other startup/build verification
- it was responsible for 73.563 seconds of the test baseline

## Step 2: Narrow Ownership Authorization Test

Previous shape:

```java
@SpringBootTest(properties = {
        "eureka.client.enabled=false",
        "spring.cloud.config.enabled=false",
        "management.tracing.enabled=false",
        "spring.datasource.url=jdbc:h2:mem:order-ownership;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.kafka.listener.auto-startup=false",
        "spring.task.scheduling.enabled=false",
        "security.jwt.issuer=shopverse-auth-service"
})
class OrderOwnershipAuthorizationTest {
    @Autowired private OrderController controller;
    @Autowired private OrderRepository repository;
}
```

This starts the full application to test one `@PreAuthorize` rule:

```java
@PreAuthorize("hasRole('ADMIN') or @orderAuthorization.isOwner(#id, authentication.name)")
public List<OrderTimelineResponse> getTimeline(@PathVariable Long id) {
    return orderService.getTimeline(id);
}
```

Implemented direction:

- keep `OrderAuthorization` as a small Spring bean
- use a focused method-security test context
- mock `OrderRepository`
- mock `OrderService`
- avoid JPA, Liquibase, Kafka, Eureka, Config Server, and web server startup

Implemented shape:

```java
@SpringJUnitConfig(OrderOwnershipAuthorizationTest.TestConfig.class)
class OrderOwnershipAuthorizationTest {

    private static final Long ORDER_ID = 1L;

    @Autowired
    private OrderController controller;

    @MockitoBean
    private OrderRepository orderRepository;

    @MockitoBean
    private OrderService orderService;

    @Test
    @WithMockUser(username = "alice", roles = "CUSTOMER")
    void ownerCanReadTimeline() {
        given(orderRepository.existsByIdAndCustomerUsername(ORDER_ID, "alice"))
                .willReturn(true);

        assertThatNoException().isThrownBy(() -> controller.getTimeline(ORDER_ID));
    }

    @Configuration
    @EnableMethodSecurity
    @Import({OrderController.class, OrderAuthorization.class})
    static class TestConfig {
    }
}
```

The small test configuration enables method security and imports only the
controller plus the authorization bean needed by the `@PreAuthorize` expression.

The optimized test avoids starting:

- embedded web infrastructure
- JPA entity manager
- Hikari datasource
- Liquibase migrations
- Kafka listeners
- Eureka client
- Config Server client
- tracing/export infrastructure

It keeps the important part: Spring method security still evaluates the real
`@PreAuthorize` expression on `OrderController#getTimeline`.

## Step 3: Share Test Properties

If full `@SpringBootTest` remains necessary, make properties identical across
tests so Spring can reuse a cached context.

Create a shared annotation or meta-annotation:

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@SpringBootTest(properties = {
        "eureka.client.enabled=false",
        "spring.cloud.config.enabled=false",
        "management.tracing.enabled=false",
        "spring.kafka.listener.auto-startup=false",
        "spring.task.scheduling.enabled=false",
        "security.jwt.issuer=shopverse-auth-service"
})
public @interface OrderServiceSpringBootTest {
}
```

Avoid changing datasource URLs between tests unless isolation requires it.

## Step 4: Disable Unneeded Infrastructure

Use test properties to turn off infrastructure that the test does not assert:

```properties
eureka.client.enabled=false
spring.cloud.config.enabled=false
management.tracing.enabled=false
spring.kafka.listener.auto-startup=false
spring.task.scheduling.enabled=false
```

For tests that do not need Liquibase:

```properties
spring.liquibase.enabled=false
```

Do not disable Liquibase in tests that intentionally validate migrations.

## Step 5: Verify

Run the focused service tests:

```powershell
cd order-service
.\gradlew.bat test --no-daemon
```

Then inspect per-class results:

```powershell
Get-ChildItem build\test-results\test -Filter "*.xml" |
  ForEach-Object {
    [xml]$x = Get-Content $_.FullName
    $suite=$x.testsuite
    [pscustomobject]@{
      File=$_.Name
      Tests=[int]$suite.tests
      Time=[double]$suite.time
    }
  } |
  Sort-Object Time -Descending
```

Target:

- remove the 73s empty context cost
- reduce the 54s authorization test to a small slice test
- keep all authorization behavior covered

Actual result after the change:

```text
order-service,test_warm,13.07,0
```

Per-class result:

| Test class | Tests | Time |
|---|---:|---:|
| `OrderOwnershipAuthorizationTest` | 3 | 5.08s |
| `ApiExceptionHandlerTest` | 1 | 0.224s |
| `CatalogServiceTest` | 1 | 0.116s |
| `OutboxEventTest` | 2 | 0.031s |

The slow empty context test no longer exists.

## Risk

Do not delete the only coverage for method-security behavior. If the test is
narrowed, it must still prove:

- owner can read timeline
- another customer cannot read timeline
- admin can read any timeline
