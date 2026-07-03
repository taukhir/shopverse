---
title: Reduce Spring Boot JAR Size
---

# Reduce Spring Boot JAR Size

Back to [Optimization Solutions](../OPTIMIZATION-SOLUTIONS.md).

## Status

Partially implemented.

Implemented safe artifact/dependency cleanup:

- removed redundant direct `spring-security-oauth2-jose` declarations from resource-server services
- kept JOSE on the runtime classpath through `spring-boot-starter-oauth2-resource-server` and `shopverse-security-starter`
- disabled plain JAR generation for Spring Boot app services so `build/libs` contains only the runnable Boot JAR

Changed build files:

- `user-service/build.gradle`
- `order-service/build.gradle`
- `payment-service/build.gradle`
- `inventory-service/build.gradle`
- `auth-service/build.gradle`
- `config-server/build.gradle`
- `discovery-server/build.gradle`
- `api-gateway/build.gradle`

Implemented Gradle artifact cleanup:

```groovy
tasks.named('jar') {
    enabled = false
}
```

Verification:

```powershell
.\gradlew.bat clean assemble -x test --no-daemon --quiet
```

Result after cleanup:

| Service | Generated JARs in `build/libs` |
|---|---|
| `discovery-server` | `discovery-server-0.0.1-SNAPSHOT.jar` |
| `config-server` | `config-server-0.0.1-SNAPSHOT.jar` |
| `auth-service` | `auth-service-0.0.1-SNAPSHOT.jar` |
| `user-service` | `user-service-0.0.1-SNAPSHOT.jar` |
| `order-service` | `order-service-0.0.1-SNAPSHOT.jar` |
| `payment-service` | `payment-service-0.0.1-SNAPSHOT.jar` |
| `inventory-service` | `inventory-service-0.0.1-SNAPSHOT.jar` |
| `api-gateway` | `api-gateway-0.0.1-SNAPSHOT.jar` |

Boot JAR sizes did not materially change. That is expected because the removed
JOSE declarations were duplicate direct edges; JOSE is still required and still
arrives transitively through the resource-server starter.

## Problem

The largest service JARs are about 119 MB.

Measured command:

```powershell
Get-ChildItem "order-service\build\libs" -Filter "*.jar" |
  Sort-Object Length -Descending
```

Measured result:

| Service | Boot JAR size |
|---|---:|
| `order-service` | 119.63 MB |
| `payment-service` | 119.03 MB |
| `inventory-service` | 119.04 MB |
| `user-service` | 98.11 MB |
| `api-gateway` | 71.24 MB |
| `discovery-server` | 62.68 MB |
| `auth-service` | 57.42 MB |
| `config-server` | 44.90 MB |

## Dependency Findings

Command used to inspect the order-service JAR:

```powershell
jar tf order-service\build\libs\order-service-0.0.1-SNAPSHOT.jar |
  Select-String "BOOT-INF/lib/"
```

Heavy dependency groups include:

| Library | Size | Why present |
|---|---:|---|
| `hibernate-core` | 13.75 MB | JPA persistence |
| `kafka-clients` | 9.32 MB | saga messaging |
| `byte-buddy` | 8.60 MB | Hibernate/proxy support |
| `bcprov-jdk18on` | 8.53 MB | JOSE/JWT crypto support |
| `zstd-jni` | 6.97 MB | Kafka compression support |
| `tomcat-embed-core` | 3.43 MB | Spring MVC runtime |
| `liquibase-core` | 2.98 MB | service-owned migrations |
| `mysql-connector-j` | 2.49 MB | MySQL runtime |
| `snappy-java` | 2.23 MB | Kafka compression support |
| `aspectjweaver` | 2.09 MB | Resilience4j/Spring AOP |
| `springdoc/swagger-ui` | about 1.09 MB for `swagger-ui` | local API documentation UI |

## Target Solution

Reduce JAR size by removing dependencies from runtime only when the service does
not need them in that runtime profile.

Do not remove required runtime dependencies just to shrink the JAR.

## Step 1: Identify Optional Runtime Features

Review each dependency group:

| Dependency group | Question |
|---|---|
| Springdoc OpenAPI UI | Is Swagger UI needed in production images or only local/dev? |
| Eureka client | Does every runtime environment still use Eureka, or can some deployments use static routing/service discovery outside the app? |
| Zipkin/tracing | Should tracing be packaged into every local image, or only observability profile/prod? |
| Prometheus registry | Required for metrics scraping; keep if Prometheus is part of the runtime target |
| Liquibase | Required if the app owns migrations at startup; optional if migrations are run separately |
| Kafka | Required for saga services |
| JPA/Hibernate | Required for database-backed services |

## Step 2: Measure Dependency Contribution

Use `dependencyInsight` for specific groups:

```powershell
cd order-service
.\gradlew.bat dependencyInsight --dependency springdoc --configuration runtimeClasspath
.\gradlew.bat dependencyInsight --dependency zipkin --configuration runtimeClasspath
.\gradlew.bat dependencyInsight --dependency eureka --configuration runtimeClasspath
```

Inspect actual JAR contents:

```powershell
jar tf build\libs\order-service-0.0.1-SNAPSHOT.jar |
  Select-String "BOOT-INF/lib/" |
  ForEach-Object { $_.ToString().Substring($_.ToString().LastIndexOf('/')+1) } |
  Sort-Object
```

## Step 3: Move Dev-Only Dependencies Out Of Runtime

If a dependency is only for local development, do not keep it in production
runtime.

Example candidate:

```groovy
implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:3.0.3'
```

Possible direction:

- keep OpenAPI in local/dev artifacts
- remove it from production image builds
- or split API docs into a profile-specific module/configuration

Do this only after confirming how the docs endpoint is used.

Current decision:

- kept Springdoc UI because the project still documents Swagger as a direct
  service feature
- did not remove Kafka compression libraries because Kafka clients include them
  for codec support and removing them can create runtime surprises if broker or
  producer compression changes
- did not remove Liquibase because services currently own and run migrations at
  startup
- did not remove Zipkin/tracing because observability remains part of the
  runtime profile

The safe change was artifact cleanup, not removing runtime features.

## Step 4: Keep Platform Starters Lean

Platform starters should not expose broad dependencies unless required.

Rules:

- use `implementation` instead of `api` by default
- use `compileOnly` for optional integrations where possible
- keep domain payloads out of platform modules
- avoid pulling web/security/data starters into modules that only need small contracts

## Step 5: Verify

After dependency changes:

```powershell
.\gradlew.bat clean bootJar --no-daemon
```

Measure:

```powershell
Get-ChildItem build\libs -Filter "*.jar" |
  Sort-Object Length -Descending |
  Select-Object Name,@{Name="SizeMB";Expression={[math]::Round($_.Length / 1MB, 2)}}
```

Run tests:

```powershell
.\gradlew.bat test --no-daemon
```

## Risk

Shrinking the JAR by removing dependencies can break runtime behavior. Each
candidate must be tied to a concrete deployment decision, not just size.

## Next Candidates

Future reductions require explicit product/runtime decisions:

| Candidate | Possible saving | Tradeoff |
|---|---:|---|
| move Swagger UI out of production runtime | about 1 MB plus transitive UI support | `/swagger-ui/**` no longer available in production artifact |
| run Liquibase outside app startup | about 3 MB plus startup work | requires separate migration job/process |
| remove Kafka compression codecs | up to several MB | unsafe if compression is enabled later |
| custom `jlink` runtime | image-size reduction, not Boot JAR reduction | requires careful Java module testing |
