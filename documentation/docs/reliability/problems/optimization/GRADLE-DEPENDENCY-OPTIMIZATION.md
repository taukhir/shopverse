---
title: Gradle Dependency Optimization
---

# Gradle Dependency Optimization

Back to [Optimization Solutions](../OPTIMIZATION-SOLUTIONS.md).

## Status

First safe implementation pass completed.

Implemented changes:

- removed unused dependencies from `shopverse-common-error`
- reduced `api` exposure in platform starter modules
- removed redundant direct `spring-security-oauth2-jose` declarations from resource-server services
- verified platform build
- verified consuming services still compile through the composite build
- verified JOSE still exists at runtime through `spring-boot-starter-oauth2-resource-server`

Changed platform modules:

- `shopverse-common-error`
- `shopverse-observability-starter`
- `shopverse-security-starter`
- `shopverse-kafka-starter`
- `shopverse-outbox-starter`
- `shopverse-kafka-recovery-starter`

Changed service builds:

- `user-service/build.gradle`
- `order-service/build.gradle`
- `payment-service/build.gradle`
- `inventory-service/build.gradle`

## Problem

Shopverse has multiple independent Gradle builds. Each service declares its own
dependencies and also consumes `shopverse-platform` through a composite build:

```groovy
includeBuild('../shopverse-platform')
```

Without dependency hygiene, this creates several problems:

- repeated version declarations across services
- redundant direct dependencies that are already provided by starters
- platform modules exposing too much through `api`
- larger compile classpaths than necessary
- harder dependency upgrades
- harder debugging when a library appears in a service JAR
- more risk that a platform starter accidentally becomes a broad shared library

## Why This Helps

Gradle dependency optimization is not only about smaller files. It improves the
shape and safety of the build.

| Benefit | Impact |
|---|---|
| Smaller compile classpaths | Faster and clearer compilation boundaries |
| Fewer direct dependencies | Less repeated Gradle code and fewer upgrade points |
| Less `api` exposure | Platform modules expose contracts, not implementation internals |
| Cleaner starter boundaries | Services depend on platform infrastructure without inheriting unnecessary compile APIs |
| Easier dependency debugging | `dependencyInsight` output is easier to reason about |
| Safer upgrades | Centralized versions and fewer duplicate declarations reduce drift |

## How We Audited Dependencies

Runtime dependency tree:

```powershell
cd order-service
.\gradlew.bat dependencies --configuration runtimeClasspath
```

Specific dependency lookup:

```powershell
.\gradlew.bat dependencyInsight --dependency spring-security-oauth2-jose --configuration runtimeClasspath
```

Find duplicated explicit declarations:

```powershell
rg -n "spring-security-oauth2-jose" user-service\build.gradle order-service\build.gradle payment-service\build.gradle inventory-service\build.gradle
```

Inspect platform dependency scopes:

```powershell
rg -n "api |implementation |compileOnly |runtimeOnly |testImplementation" shopverse-platform
```

## What We Changed

### 1. Removed Unused Common Error Dependencies

Before, `shopverse-common-error` declared Spring Web and Jackson annotations:

```groovy
dependencies {
    api 'com.fasterxml.jackson.core:jackson-annotations'
    api 'org.springframework:spring-web'
}
```

But `ApiErrorResponse` is only a Java record:

```java
public record ApiErrorResponse(
        int status,
        String message,
        LocalDateTime timestamp,
        Map<String, String> errors
) {
}
```

So the module does not need Spring Web or Jackson annotations.

After:

```groovy
description = 'Common API error response contracts for Shopverse services.'
```

### 2. Reduced Platform `api` Exposure

Rule used:

- use `api` only when consumers need the type on their compile classpath because it appears in a public contract
- use `implementation` for starter internals, auto-configuration dependencies, metrics, logging, Jackson parsing, Kafka publishing, and Spring infrastructure
- use `compileOnly` for optional/container-provided APIs such as Servlet

Example before:

```groovy
dependencies {
    api 'org.springframework.boot:spring-boot-autoconfigure'
    api 'org.springframework.kafka:spring-kafka'
    api 'io.micrometer:micrometer-core'
    api 'org.slf4j:slf4j-api'
}
```

Example after:

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-autoconfigure'
    implementation 'org.springframework.kafka:spring-kafka'
    implementation 'io.micrometer:micrometer-core'
    implementation 'org.slf4j:slf4j-api'
}
```

This keeps runtime behavior intact while reducing what platform modules leak to
consumer compile classpaths.

### 3. Removed Redundant JOSE Direct Dependencies

Before, resource-server services declared both:

```groovy
implementation 'org.springframework.boot:spring-boot-starter-oauth2-resource-server'
implementation 'org.springframework.security:spring-security-oauth2-jose'
```

The resource-server starter already brings JOSE.

After:

```groovy
implementation 'org.springframework.boot:spring-boot-starter-oauth2-resource-server'
```

Verification:

```powershell
cd order-service
.\gradlew.bat dependencyInsight --dependency spring-security-oauth2-jose --configuration runtimeClasspath --quiet
```

Result:

```text
org.springframework.security:spring-security-oauth2-jose:7.0.5
\--- org.springframework.boot:spring-boot-security-oauth2-resource-server:4.0.6
     \--- org.springframework.boot:spring-boot-starter-oauth2-resource-server:4.0.6
```

This confirms JWT JOSE support remains on the runtime classpath.

## Verification

Platform build:

```powershell
cd order-service
.\gradlew.bat -p ..\shopverse-platform clean build --no-daemon
```

Result:

```text
BUILD SUCCESSFUL
```

Service compile verification:

```powershell
$services=@('user-service','order-service','payment-service','inventory-service','auth-service','config-server','discovery-server')
foreach($svc in $services){
  Push-Location $svc
  .\gradlew.bat clean compileJava --no-daemon --quiet
  Pop-Location
}
```

Result:

| Service | Result |
|---|---|
| `user-service` | passed |
| `order-service` | passed |
| `payment-service` | passed |
| `inventory-service` | passed |
| `auth-service` | passed |
| `config-server` | passed |
| `discovery-server` | passed |

## Scope Rules Going Forward

Use these rules for new dependencies:

| Scope | Use when |
|---|---|
| `api` | A library type appears in the module's public API and consumers need it to compile |
| `implementation` | The dependency is used internally by the module |
| `compileOnly` | Needed to compile, but provided by the runtime/container or optional integration |
| `runtimeOnly` | Needed only when the app runs, not to compile |
| `testImplementation` | Test code only |
| `annotationProcessor` | Compile-time code generation/config metadata |

## What Is Not Done Yet

These are useful next steps, but they should be done separately:

1. Add a shared version catalog for dependency aliases.
2. Evaluate dependency locking after dependency shape stabilizes.
3. Add dependency verification metadata only when the team is ready to maintain it.
4. Continue auditing large runtime libraries before removing any feature dependency.

## Future Target: Version Catalog

The likely target is a shared catalog:

```toml
[versions]
spring-cloud = "2025.1.1"
springdoc = "3.0.3"
resilience4j = "2.4.0"
testcontainers = "2.0.5"
```

Services would then use aliases instead of hard-coded versions:

```groovy
implementation libs.springdoc.webmvc.ui
implementation libs.resilience4j.spring.boot
```

Because this repository has multiple independent Gradle builds, we should
introduce the catalog carefully and verify each service one at a time.

## Gradle Convention Plugins

Status: implemented first pass.

Goal: reduce repeated Gradle setup across services without forcing all services
into one root multi-project build. Each service remains independently buildable
and keeps the current `includeBuild('../shopverse-platform')` model.

### Implemented Approach

Shopverse uses a small included build for Gradle convention plugins:

```text
build-logic/
  settings.gradle
  build.gradle
  src/main/groovy/io.shopverse.java-service-conventions.gradle
  src/main/groovy/io.shopverse.spring-boot-service-conventions.gradle
  src/main/groovy/io.shopverse.integration-test-conventions.gradle
```

This is cleaner than copying root scripts because each service applies the same
local plugin while remaining a standalone Gradle project.

### Build Logic

- `java-service-conventions`: Java 21 toolchain, repositories, test launcher,
  JUnit Platform, and common `jar` behavior.
- `spring-boot-service-conventions`: Spring Boot plugin,
  dependency-management plugin, Spring Cloud BOM, actuator/test defaults.
- `integration-test-conventions`: shared `integrationTest` source set,
  configurations, and task for `order-service`, `payment-service`, and
  `inventory-service`.

### Service Wiring

Update each service `settings.gradle`:

```groovy
pluginManagement {
    includeBuild('../build-logic')
}

includeBuild('../shopverse-platform')
```

Repeated plugin/config blocks in service `build.gradle` files are replaced with:

```groovy
plugins {
    id 'io.shopverse.spring-boot-service-conventions'
}
```

For services with integration tests:

```groovy
plugins {
    id 'io.shopverse.spring-boot-service-conventions'
    id 'io.shopverse.integration-test-conventions'
}
```

### Centralized Versions

The convention plugins currently centralize these repeated versions:

- Spring Boot: `4.0.6`
- Spring Cloud: `2025.1.1`
- Resilience4j: `2.4.0`
- Testcontainers: `2.0.5`

A version catalog is still a useful future step for dependency aliases, but the
first migration keeps version constants in the convention plugin.

### Centralized Common Configuration

These repeated blocks now live in conventions:

- `group = 'io.shopverse'`
- `version = '0.0.1-SNAPSHOT'`
- Java 21 toolchain
- `repositories { mavenCentral() }`
- Spring Cloud BOM import
- `tasks.named('test') { useJUnitPlatform(); maxParallelForks = 1 }`
- `tasks.named('jar') { enabled = false }`
- `testRuntimeOnly 'org.junit.platform:junit-platform-launcher'`

Still intentionally left in service builds unless a later pass proves they are
universal:

- `developmentOnly 'org.springframework.boot:spring-boot-devtools'`
- `runtimeOnly 'io.micrometer:micrometer-registry-prometheus'`

Do not blindly centralize domain or service-specific dependencies such as JPA,
Kafka, Feign, Liquibase, security, platform starters, or Springdoc. Keep those
in the service build until the dependency belongs to every service using the
same semantics.

### Migration Order Used

The intended migration order is:

1. `config-server`
2. `discovery-server`
3. `api-gateway`
4. `auth-service`
5. `user-service`
6. `order-service`
7. `payment-service`
8. `inventory-service`

Start with smaller services, then migrate services with custom integration tests
and larger dependency surfaces.

### Verification

After each service migration:

```powershell
cd service-name
.\gradlew.bat test --no-daemon
```

For integration-test services:

```powershell
.\gradlew.bat integrationTest --no-daemon
```

Also verify Docker builds still work because Dockerfiles copy each service's
`settings.gradle`, `build.gradle`, and wrapper.

### Docker Note

Because service builds depend on `../build-logic`, every service Dockerfile must copy
`build-logic` into the Docker build context, just like services currently copy
`shopverse-platform`.

Example:

```dockerfile
COPY build-logic ../build-logic
COPY shopverse-platform ../shopverse-platform
```

This has been added to the Java service Dockerfiles.

## Risk

Changing `api` to `implementation` can break consumers if they compile directly
against platform classes whose method signatures expose those dependency types.
That is why the first pass was followed by:

- full platform build
- clean service compilation through the composite build
- dependency insight checks for critical runtime dependencies
