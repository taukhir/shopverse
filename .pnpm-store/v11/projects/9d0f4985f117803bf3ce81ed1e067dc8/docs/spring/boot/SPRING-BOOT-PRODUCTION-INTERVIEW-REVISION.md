---
title: Spring Boot Production Interview And Revision
description: Spring Boot rapid revision and lead-level scenario bank covering startup, conditions, configuration, web runtime, data, pools, Actuator, containers, incidents, and design trade-offs.
difficulty: Advanced
page_type: Interview
status: maintained
prerequisites: [Spring Boot architect path]
learning_objectives: [Revise Boot internals quickly, Structure lead-level answers, Diagnose production scenarios, Explain evidence and trade-offs]
technologies: [Spring Boot 4, Spring Framework 7, Actuator, JVM, Kubernetes]
last_reviewed: "2026-07-30"
scope: generic
owner: docs-spring
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Spring Boot Production Interview And Revision

## Answer Framework

For each question explain:

1. the owning runtime component;
2. the execution sequence and thread/transaction boundary;
3. what can fail;
4. which evidence distinguishes likely causes;
5. the safest mitigation and long-term correction;
6. the rejected alternative and trade-off.

## Startup Revision

```text
SpringApplication
  -> determine application type
  -> prepare Environment and ConfigData
  -> create ApplicationContext
  -> load definitions and auto-configurations
  -> invoke factory/bean post-processors
  -> instantiate non-lazy singletons and proxies
  -> start web server/lifecycle components
  -> runners
  -> readiness accepts traffic
```

Important distinctions:

- a bean definition is metadata; a bean instance is a created object;
- a `BeanFactoryPostProcessor` changes definitions before ordinary bean creation;
- a `BeanPostProcessor` participates in instance initialization and proxy creation;
- conditions decide whether configuration contributes definitions;
- readiness should change only when the application can serve safely.

## Scenario Bank

### Startup became 90 seconds after a release

Compare startup steps/JFR between good and bad versions. Inspect new classpath scanning,
DNS/network calls, migrations, eager clients, entropy/TLS, bean initialization and resource
pool timeouts. Do not add lazy initialization globally before identifying which startup
contract became slow.

### A bean is missing only in production

Inspect active profiles, property origins, classpath/dependency graph, component scan,
auto-configuration condition report and user-bean back-off. Compare the built artifact,
not only source.

### `@Transactional` does not roll back

Check proxy eligibility, self-invocation, method visibility, exception/rollback rules,
transaction manager, propagation and whether the side effect belongs to the same resource.
Kafka, database and remote API side effects are not one atomic transaction by default.

### Service is healthy but returns intermittent 503

Trace ingress/LB, readiness/endpoints, connector queue, executor, downstream pools,
timeouts/retries and dependency health. A health endpoint from localhost bypasses much of
the production request path.

### Memory grows in Kubernetes but heap looks stable

Inspect container working set, direct buffers, thread stacks, metaspace/class loaders,
native agents/libraries, mapped files and JVM Native Memory Tracking. Heap tuning alone can
make the failure worse.

### Graceful shutdown still loses Kafka/HTTP work

Verify readiness transition, endpoint propagation, server shutdown timeout, executor and
listener stop order, acknowledgment/transaction boundaries and platform termination grace.
Shutdown must stop admission before exhausting the completion budget.

### Adding retries caused an outage

Compute retry multiplication across gateway, client and consumer layers. Check whether
timeouts fit the end-to-end deadline and whether retries are bounded, jittered and limited
to idempotent transient operations.

## Top Questions

**What does `@SpringBootApplication` combine?** Configuration, component scanning and
auto-configuration enablement. Placement influences default scan/auto-configuration packages.

**How does Boot auto-configuration work?** It imports candidate configurations and applies
classpath, bean, property and environment conditions. Defaults commonly back off when the
application supplies an explicit bean.

**What is the difference between liveness and readiness?** Liveness asks whether restart
may repair the process; readiness asks whether it should receive traffic now.

**Why avoid field injection?** Constructor injection makes required dependencies explicit,
supports immutability and simplifies framework-independent tests.

**Why can `@Async` or `@Transactional` fail on self-invocation?** The internal `this` call
bypasses the proxy where advice is applied.

**How do you size a Boot service?** Start from workload/SLO, measure service and dependency
times, then bound connector/executor/connection pools and memory against actual CPU,
downstream capacity and container limits.

## Focused Platform Questions

<ExpandableAnswer title="How does external configuration precedence work, and why prefer @ConfigurationProperties?">

Later/higher-priority property sources override earlier ones according to Boot's
Config Data and environment rules; profile activation and imported locations alter
which sources participate. Diagnose the winning value with property-origin evidence.
Use validated `@ConfigurationProperties` for cohesive typed configuration instead of
scattering string-based `@Value` expressions throughout services.

</ExpandableAnswer>

<ExpandableAnswer title="How do you build and verify custom auto-configuration?">

Publish candidates through `AutoConfiguration.imports`, guard them with stable
class/bean/property conditions, define user-bean back-off, expose typed properties,
and test missing-class, enabled/disabled, invalid-property and user-override cases
with `ApplicationContextRunner`. Auto-configuration order affects definition
processing, not arbitrary singleton startup order.

</ExpandableAnswer>

<ExpandableAnswer title="How should Actuator endpoints be exposed and secured?">

Availability, exposure and authorization are separate decisions. Expose only the
operational endpoints required by the platform, protect them with a dedicated
management security/network boundary, sanitize sensitive configuration, and avoid
publishing heap dumps, environment values or mutable endpoints broadly. A custom
`SecurityFilterChain` makes the application responsible for the complete access
policy because Boot security back-off applies.

</ExpandableAnswer>

<ExpandableAnswer title="How do metrics, observations, traces and logs relate in Spring Boot?">

Micrometer meters aggregate numeric behavior; observations can drive metrics and
spans; tracing propagates causal context across supported HTTP/messaging clients;
structured logs provide detailed events correlated with trace and business IDs.
Preserve propagation across async boundaries and keep metric labels bounded—customer,
order and trace IDs do not belong in metric tags.

</ExpandableAnswer>

<ExpandableAnswer title="When should you use a test slice, @SpringBootTest or ApplicationContextRunner?">

Use a slice for one framework boundary such as MVC or JPA, `@SpringBootTest` for the
assembled application behavior, and `ApplicationContextRunner` for fast conditional
configuration/back-off matrices. Unnecessary mocks, profiles, dynamic properties and
customizers create distinct context-cache keys and make a suite slower even when
individual tests look small.

</ExpandableAnswer>

<ExpandableAnswer title="What does a FailureAnalyzer provide?">

It recognizes a startup exception and returns a human-readable description,
corrective action and cause. It improves failure reporting but does not recover the
context. A custom analyzer must avoid secrets, return `null` when it cannot explain
the failure, and be tested against both matching and unrelated exceptions.

</ExpandableAnswer>

<ExpandableAnswer title="How do servlet threads, reactive event loops and application executors differ?">

Servlet code normally occupies a request thread while it runs or blocks. WebFlux
event loops must not block because a small number of threads multiplex many
connections. Application executors introduce another queue and concurrency budget.
For every model, bound admission, downstream pools, timeouts and queue age rather
than increasing threads without locating the bottleneck.

</ExpandableAnswer>

<ExpandableAnswer title="Do virtual threads remove the need for pool and capacity limits?">

No. They reduce the cost of many blocking Java tasks, but do not create database
connections, remote capacity, CPU or memory. Pinning, thread-local assumptions and
unbounded submission still need evidence. Keep database/client pools and admission
bounded, and compare throughput, latency and native/thread memory under load.

</ExpandableAnswer>

## Rapid Recall

| Topic | Recall |
|---|---|
| ConfigData | ordered external inputs with origin and activation |
| condition report | why auto-configuration matched or backed off |
| ApplicationContext | bean factory plus events/resources/environment/lifecycle |
| proxy | interception boundary; target self-call may bypass it |
| Actuator | operations endpoints, health contributors, metrics and lifecycle integration |
| availability | liveness and readiness application states |
| graceful shutdown | refuse admission, drain, bound completion, terminate |
| AOT/native | build-time analysis with dynamic-feature constraints |
| buildpack | builds OCI image from curated build/run lifecycle |

## Recommended Revision Route

Return to [Spring Boot Beginner-To-Architect Path](../SPRING-BOOT-ARCHITECT-PATH.md), then
practise explaining one startup incident, one request-latency incident and one failed
deployment with evidence.

## Official References

- [Spring Boot Reference Documentation](https://docs.spring.io/spring-boot/reference/)
- [Spring Boot Actuator](https://docs.spring.io/spring-boot/reference/actuator/)
- [Spring Boot testing](https://docs.spring.io/spring-boot/reference/testing/)
