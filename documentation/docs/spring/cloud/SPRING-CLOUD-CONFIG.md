---
title: Spring Cloud Config, Refresh, And Secrets
description: Design Config Server and Client repositories, precedence, startup behavior, refresh scope, encryption, secrets, HA, and incident recovery.
difficulty: Advanced
page_type: Deep Dive
status: Generic
prerequisites: [Spring Cloud Architect Learning Path]
learning_objectives: [Trace configuration resolution, Design safe refresh and rollback, Secure and operate Config Server]
technologies: [Spring Cloud Config, Spring Boot Actuator]
last_reviewed: "2026-07-23"
---

# Spring Cloud Config, Refresh, And Secrets

## Runtime Model

Config Client asks Config Server for an environment identified by application, profile,
and label. The server resolves a backend such as Git, Vault, filesystem, or composite
sources and returns property sources. Spring Boot then merges them with local/system/
environment inputs according to its configuration model.

```text
application + profile + label
  -> Config Server
     -> backend checkout/read
     -> Environment/property sources
  -> client bootstrap/import
  -> Environment binding and bean creation
```

Use `spring.config.import` with the Config Server location. Decide explicitly whether
config unavailability is fatal or optional; critical applications usually fail closed for
missing required configuration rather than silently start with unsafe defaults.

## Repository Design

Use version control, review, branch/tag/label policy, ownership, validation, and rollback.
Separate global defaults from application/profile overrides. Avoid a single file that grants
every team power over every service. Validate duplicate keys, type binding, deprecated
properties, and environment differences in CI.

Labels can pin a configuration revision for deployment consistency. Mutable branch-head
reads are convenient but can make simultaneous instances observe different changes.

## Configuration Precedence

Debug the resulting Environment and origin, not only source files. Command-line, system,
environment, local documents, remote sources, profile documents, and test properties can
override one another depending on Boot/Config settings. Expose only sanitized diagnostics;
Actuator environment endpoints can leak secrets.

Prefer typed `@ConfigurationProperties` with validation:

```java
@ConfigurationProperties("checkout.payment")
@Validated
public record PaymentPolicy(
    @NotNull Duration timeout,
    @Min(1) int maxConcurrentCalls
) {}
```

## Refresh Semantics

Refreshing changes an environment; it does not guarantee every object, pool, scheduler,
client, cache, or in-flight operation adopts the new value atomically. `@RefreshScope`
recreates scoped beans lazily, which can change identity and lifecycle behavior.

Classify configuration:

- safe dynamic: feature percentage, bounded threshold with validation;
- coordinated: timeout and retry budgets across callers/dependencies;
- restart-required: ports, thread/pool topology, deep framework initialization;
- migration-required: schema, event contract, encryption/key format.

Canary, audit, validate, observe, and roll back dynamic changes. Prefer deployment rollout
for values whose partial application is dangerous.

## Secrets

Config Server may integrate encrypted values or a secret backend, but source control is not
a secret manager. Design authentication, authorization by application/environment, TLS,
key rotation, secret lease/renewal, audit, redaction, and failure behavior. Never expose
decryption endpoints or Actuator details publicly.

Rotation requires consumers to replace connections/tokens safely. A property update alone
may leave old pooled connections active.

## High Availability And Caching

Run multiple stateless Config Server instances behind a load balancer, make backend access
resilient, and monitor backend latency/errors. Client retry can help transient startup
failures but must be bounded with jitter. Cached/stale configuration is a business decision:
record maximum staleness and fail-open/fail-closed policy.

## Production Scenarios

**Config backend is unavailable during deployment.** Existing instances may continue with
loaded values; new ones may fail. Stop rollout, restore server/backend, avoid optional fallback
that masks required config, and validate revision consistency before resuming.

**Bad configuration reached every instance.** Freeze further refresh, roll back repository
revision, broadcast or roll out the correction using the same controlled path, validate bean/
pool recreation, and add pre-merge semantic validation/canary.

**Two pods show different values.** Compare config revision/label, active profiles, property
origin, refresh time, local overrides, and rollout version.

## Official References

- [Spring Cloud Config reference](https://docs.spring.io/spring-cloud-config/reference/)
- [Spring Boot externalized configuration](https://docs.spring.io/spring-boot/reference/features/external-config.html)

## Recommended Next

Continue with [Discovery, LoadBalancer, OpenFeign, And HTTP Failure Semantics](./SPRING-CLOUD-DISCOVERY-CLIENTS.md).

