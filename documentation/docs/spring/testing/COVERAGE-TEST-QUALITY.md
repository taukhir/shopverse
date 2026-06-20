---
title: Coverage And Test Quality
---

# Coverage And Test Quality

Coverage strategy, JaCoCo, other quality tools, exclusions, and testing do/do not guidance.

Back to [Spring Boot Testing](../SPRING-BOOT-TESTING.md).

## Test Coverage Strategy

Coverage is evidence of execution, not proof of correctness. A test can execute
every line without asserting the right outcome. Use coverage to find
unexercised risk, then evaluate test quality through assertions, mutation
testing, defect history, and review.

### Coverage By Test Level

Do not assign one percentage independently to unit, integration, and E2E tests.
They overlap and measure different risks:

| Test level | Coverage expectation | Primary purpose |
|---|---|---|
| Unit | broad branch coverage of domain and service logic | fast behavior and edge-case feedback |
| Spring slice | controllers, validation, serialization, repositories, security mapping | framework integration by layer |
| Integration | database, Kafka, HTTP client, migration, transaction, and security contracts | real dependency behavior |
| E2E | a small number of critical user journeys | deployed-system confidence |

A pragmatic starting policy:

| Metric or scope | Suggested starting target |
|---|---:|
| Overall line coverage | 70-80% |
| Overall branch coverage | 60-70% |
| Critical domain/security/payment logic | 85-90% line and strong branch coverage |
| Changed production code | 80% or higher where practical |
| Generated/configuration/DTO code | exclude deliberately or accept lower coverage |
| E2E journeys | cover critical paths, not a percentage of methods |

These are engineering guidelines, not universal quality guarantees. A small
payment authorization component may require stronger coverage than generated
configuration code. Teams should raise thresholds gradually after measuring
the current baseline.

Never satisfy a target with assertions that prove nothing:

```java
assertNotNull(service);
```

Prefer behavior and boundary assertions:

```java
assertThat(result.status()).isEqualTo(PaymentStatus.DECLINED);
verify(paymentRepository).save(argThat(payment ->
        payment.getFailureReason().equals("INSUFFICIENT_FUNDS")
));
verify(eventPublisher, never()).publishPaymentCompleted(any());
```

### What To Cover

For each important operation, cover:

- normal success;
- boundary values;
- invalid input;
- authorization allowed and denied;
- missing state;
- duplicate/idempotent request;
- optimistic-lock or conflict path;
- dependency timeout and retry exhaustion;
- transaction rollback;
- asynchronous eventual success and terminal failure;
- serialization and schema compatibility.

Coverage should be risk-weighted. Authentication, authorization, money,
inventory, transactions, concurrency, and recovery need deeper testing than
simple getters.


## JaCoCo

JaCoCo instruments Java bytecode and records which instructions, lines,
branches, methods, and classes execute during tests.

Gradle configuration:

```gradle
plugins {
    id 'java'
    id 'jacoco'
}

jacoco {
    toolVersion = '<managed-version>'
}

tasks.test {
    useJUnitPlatform()
    finalizedBy tasks.jacocoTestReport
}

tasks.jacocoTestReport {
    dependsOn tasks.test
    reports {
        html.required = true
        xml.required = true
        csv.required = false
    }
}
```

Reports are normally generated under:

```text
build/reports/jacoco/test/html/index.html
build/reports/jacoco/test/jacocoTestReport.xml
```

XML is useful for CI quality platforms; HTML is useful for local investigation.

### Coverage Enforcement

```gradle
tasks.jacocoTestCoverageVerification {
    violationRules {
        rule {
            limit {
                counter = 'LINE'
                value = 'COVEREDRATIO'
                minimum = 0.75
            }
            limit {
                counter = 'BRANCH'
                value = 'COVEREDRATIO'
                minimum = 0.65
            }
        }
    }
}

tasks.check {
    dependsOn tasks.jacocoTestCoverageVerification
}
```

Do not immediately impose a threshold above the existing baseline. First
publish the report, record the baseline, exclude only justified generated
code, then increase the gate in controlled steps.

### Unit And Integration Coverage

If unit and integration tests use separate Gradle tasks, each task can produce
an execution-data file. Merge those files for one service-level report:

```gradle
tasks.register('jacocoCombinedReport', JacocoReport) {
    dependsOn tasks.test, tasks.integrationTest

    executionData(
            tasks.test,
            tasks.integrationTest
    )
    sourceSets sourceSets.main

    reports {
        html.required = true
        xml.required = true
    }
}
```

Exact Gradle configuration depends on how the custom integration source set is
declared. Ensure the report includes production classes once and execution data
from all relevant test tasks.

For a multi-service repository, publish:

- per-service reports for ownership;
- an aggregate report for visibility;
- changed-code coverage in pull requests;
- separate test-result and coverage artifacts.


## Other Test Quality Tools

| Tool | Purpose |
|---|---|
| JaCoCo | line, branch, instruction, method, and class coverage |
| PIT/Pitest | mutation testing; checks whether tests detect changed behavior |
| SonarQube/SonarCloud | combines coverage, duplication, bugs, vulnerabilities, and quality gates |
| Codecov/Coveralls | hosts and compares coverage reports, including pull-request diffs |
| Gradle test reports | test results, failures, and durations |
| JUnit XML | standard CI test-result exchange format |
| ArchUnit | verifies package, layer, and dependency architecture rules |
| Testcontainers | verifies behavior against real infrastructure |
| WireMock/MockWebServer | stubs HTTP dependencies and verifies client contracts |
| Awaitility | bounded assertions for asynchronous behavior |

Mutation testing is stronger than ordinary coverage for test effectiveness:

```text
production condition: quantity > 0
mutation:            quantity >= 0
```

If all tests still pass, the suite did not prove the boundary. Mutation testing
is CPU-intensive, so run it on critical modules or scheduled CI rather than
necessarily on every commit.

Static analysis and coverage solve different problems. A line can be covered
and still contain a security defect, race condition, resource leak, or weak
assertion.


## Coverage Exclusions

Potential exclusions include:

- generated sources;
- framework-generated bootstrap code;
- pure configuration property records;
- migration files, which need migration tests rather than Java coverage;
- simple DTOs only when they contain no behavior.

Do not broadly exclude controllers, entities, configuration classes, exception
handlers, or difficult code merely to improve the percentage. Record every
exclusion and its reason.


## Testing Do And Do Not

| Do | Do not |
|---|---|
| Test observable behavior | Test private methods directly |
| Use the smallest sufficient test scope | Start a full Spring context for every test |
| Mock external collaborators in unit tests | Mock the class under test |
| Use real infrastructure for persistence and broker contracts | Assume mocks prove SQL, locking, or Kafka behavior |
| Keep tests deterministic and isolated | Depend on order, shared state, or wall-clock timing |
| Use bounded Awaitility polling | Use long fixed sleeps |
| Cover success, denial, conflict, and rollback | Test only the happy path |
| Treat coverage as a diagnostic metric | Treat 100% coverage as proof of quality |
| Enforce gradual, risk-based coverage gates | Add meaningless tests to satisfy a percentage |
| Prefer Mockito and refactoring | Introduce PowerMock into new code |
| Close static mocks and resources | Leak test state into another test |
| Verify important side effects | Verify every internal method call |
| Use unique data and idempotency keys | Reuse mutable fixtures across tests |
| Keep E2E tests few and business-focused | Reproduce every validation case through Docker |







