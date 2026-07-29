---
title: Spring Boot Configuration Profiles And Environments
description: In-depth Spring Boot configuration guide covering ConfigData, precedence, profiles, typed binding, validation, secrets, imports, refresh boundaries, tests, and production incidents.
difficulty: Intermediate
page_type: Deep Dive
status: Generic
prerequisites: [Spring fundamentals, YAML and properties]
learning_objectives: [Explain configuration precedence, Bind and validate typed settings, Use profiles safely, Protect secrets, Diagnose unexpected values]
technologies: [Spring Boot 4, ConfigData, ConfigurationProperties, Kubernetes]
last_reviewed: "2026-07-28"
---

# Spring Boot Configuration Profiles And Environments

External configuration separates a deployable artifact from environment-specific values.
It does not justify storing every behavioral decision in mutable configuration.

## Resolution Model

Spring Boot builds an `Environment` from ordered property sources. Higher-precedence
sources can override lower ones. The exact complete order is version-specific, but the
diagnostic method is stable: identify the property name, inspect its origin, confirm active
profiles/imports, and determine whether binding converted it to the expected type.

```text
configuration documents/imports + environment variables + system/command-line inputs
  -> Environment property sources
  -> placeholder resolution and type conversion
  -> @ConfigurationProperties binding
  -> validation
  -> bean creation
```

Do not memorize a partial precedence list and guess during an incident. Use Actuator's
sanitized environment/configuration-properties views and origin-aware diagnostics under
appropriate authorization.

## Typed Configuration

```java
@ConfigurationProperties("payment.client")
@Validated
public record PaymentClientProperties(
        @NotBlank URI baseUrl,
        @NotNull Duration connectTimeout,
        @NotNull Duration responseTimeout,
        @Min(1) int maxConcurrentRequests) {
}
```

Typed configuration provides conversion, discoverable metadata, validation and a coherent
ownership boundary. Prefer `Duration`, `DataSize`, URI and domain enums over ambiguous raw
strings/integers. Fail startup for unsafe required values instead of discovering them on
the first production request.

## Profiles

Profiles select bean/configuration variants. Use them for coarse environment or capability
composition, not thousands of conditional code paths. Avoid `dev`, `qa` and `prod` branches
inside domain logic. Prefer capability names and explicit configuration contracts.

Risks include profile groups activating more than expected, profile-specific documents
silently overriding a base value, and tests passing because they use a profile unlike
production.

## Imports And Config Trees

ConfigData imports can compose files, remote/config-tree sources and optional locations.
Required imports should fail clearly when unavailable. Optional imports trade startup
availability for the risk of running with defaults; use them only when defaults are safe.

Kubernetes-mounted secrets/configuration can be represented as files. Decide whether a
change requires immutable rollout, application restart or a supported refresh mechanism.
Not every already-created bean safely changes at runtime.

## Secrets

- retrieve from an approved secret manager or mounted secret mechanism;
- never place secrets in source, image layers, command-line arguments or diagnostic dumps;
- restrict Actuator configuration endpoints and sanitize sensitive values;
- rotate credentials with an overlap window when protocols permit;
- test both old-to-new transition and revocation;
- distinguish secret value rotation from TLS trust/certificate rotation.

## Configuration Failure Runbook

1. Capture the exact effective value symptom without exposing the secret.
2. Confirm application version, deployment, active profiles and command line.
3. Inspect property origin and relaxed-binding name conversion.
4. Check import reachability, format, document activation and placeholder resolution.
5. Inspect `@ConfigurationProperties` binding/validation errors.
6. Compare with a healthy instance using sanitized evidence.
7. Correct the owning source and perform the declared rollout/refresh strategy.

## Interview Questions

**Why prefer `@ConfigurationProperties` to many `@Value` fields?** It creates a typed,
validated, testable configuration aggregate and centralizes ownership.

**Should configuration refresh every bean live?** No. Existing clients, pools and caches
may not be safely reconstructable atomically. Define refresh scope, validation, rollback
and concurrency behavior—or use immutable deployment rollout.

**Why are command-line secrets dangerous?** Process listings, diagnostics and deployment
metadata can expose them.

## Official Reference

- [Spring Boot externalized configuration](https://docs.spring.io/spring-boot/reference/features/external-config.html)

