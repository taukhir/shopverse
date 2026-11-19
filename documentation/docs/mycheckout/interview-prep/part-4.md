---
slug: /mycheckout/interview-prep/part-4
title: "mycheckout — Checkout Platform: Interview Preparation — Part 4"
mdx:
  format: md
difficulty: Advanced
page_type: Reference
status: maintained
scope: generic
owner: docs-mycheckout
reviewer: documentation-maintainers
review_evidence: imported-source-documentation-link-and-build-check
last_reviewed: "2026-11-16"
---

# mycheckout — Checkout Platform: Interview Preparation — Part 4

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `INTERVIEW-PREP.md` |
| Source SHA256 | `d66d6ba6319504f369415902a6e00eb5d3899fda752d33ddc02b69eb911129ef` |
| Guide part | 4 of 7 |

[Part 1](/mycheckout/interview-prep/part-1) · [Part 2](/mycheckout/interview-prep/part-2) · [Part 3](/mycheckout/interview-prep/part-3) · [Part 4](/mycheckout/interview-prep/part-4) · [Part 5](/mycheckout/interview-prep/part-5) · [Part 6](/mycheckout/interview-prep/part-6) · [Part 7](/mycheckout/interview-prep/part-7)

## Q9. How do we handle security? {#q9-how-do-we-handle-security}

### Say this {#say-this-8}

<a id="shared-958b70133076"></a>

> "Defence in depth. At the edge, **Istio** gateways and **JWT validation** in the mesh. At the app tier, an **OPA sidecar** checks scopes per API, and checkout also runs an ownership policy so a logged-in user can only act on their own checkout, with anonymous checkouts tied to an anonymous-id header. Inside the cluster, **Kubernetes network policies** list exactly which services may call biz, and every service has its own **IAM role via IRSA**, so pods never hold long-lived AWS keys. Secrets come from **SSM Parameter Store**; partner integrations use **OAuth2 client credentials**; data has **TTLs** (checkouts expire after 90 days) and address PII is kept in a per-market Postgres schema."

### Go deeper (E2E §10.1) {#go-deeper-e2e-101}

<a id="shared-01b7a4b9cdb6"></a>

| Layer | Mechanism |
|---|---|
| Edge / mesh | Istio virtual services on public, private and partner gateways; mesh-level JWT validation with per-route exclusions |
| App tier authz | OPA sidecar with policy-as-code (`policies-as-code/`): allow if the STS token has an actor (service-to-service on behalf of a user), else per-API rule: scope required, scope must match if a token exists, or anonymous allowed via anon-id header |
| Ownership | In-app OPA policy: user id must equal the checkout's profile id, or the anon id must match |
| East-west | Network policy allow-list on biz; internal DNS per tenant/env |
| Workload identity | IRSA service-account role per service per tenant/env |
| Secrets | SSM parameters injected as env; Kafka credentials via service accounts with ACL roles defined in infra code |
| Data | DynamoDB TTL (checkout 90 days, sales order staging 1 hour); Postgres slow-query logging to CloudWatch configured (pgaudit is set to log nothing in the config I checked) |
| Supply chain | Dependabot, Sonar, Checkstyle, private CodeArtifact for dependencies, base images from an internal registry |

### Hardening items I identified (talk about these carefully) {#hardening-items-i-identified-talk-about-these-carefully}

Frame these as "things I found while reviewing the code and raised", which shows ownership. Keep it at pattern level:

<a id="shared-6e44285b872b"></a>

1. **Ownership is checked on create but not on every later operation** by checkout id; later calls rely on the scope policy. Fix: enforce ownership on every read/write, or bind the checkout to the session.
2. **A client-supplied channel header relaxes a policy** for a specific channel. Fix: derive channel from the authenticated client identity, not a header.
3. **The biz tier is attached to a public gateway route with broad JWT exclusions**, so it relies on the gateway not being reachable. Fix: private gateway only, plus authz in biz as a second layer.
4. **PII in DEBUG logs** in some services. Fix: masking in the logger, never DEBUG in prod.
5. **Credentials in local test files** (sample requests). Fix: scrub, rotate, add secret scanning to pre-commit and CI.

### What the code shows vs. why {#what-the-code-shows-vs-why-7}

<a id="shared-2083deba4b99"></a>

- **Shows:** the mechanisms and the items above.
- **Reasoned:** zero-trust-ish layering because the platform has many internal callers and several external partners; IRSA and SSM to avoid static credentials.

### Likely follow-ups {#likely-follow-ups-8}

<a id="shared-5a9f80b0968e"></a>

- **"How do anonymous (guest) checkouts stay secure?"** Guest checkout is enabled per market; the anon-id header ties the checkout to the browser session, and ids are UUIDs. I'd strengthen it by signing the anon id or binding it to a server-issued token.
- **"How do you protect payment data?"** Card data doesn't pass through checkout; the payment service handles it (PCI scope stays there). I only saw payment method selections and transaction references in checkout. Say "as far as I've seen in our code" to be safe.
- **"How do services authenticate to each other?"** Inside the mesh by network policy and tokens with an actor claim; to partners by OAuth2 client credentials; to AWS by IRSA.

---

## Q10. Why did we move from Spring Boot to Quarkus? (asked often) {#q10-why-did-we-move-from-spring-boot-to-quarkus-asked-often}

### Say this {#say-this-9}

<a id="shared-c4fd5f089210"></a>

> "We moved the **lightweight, I/O-bound services** to Quarkus and compile them to **GraalVM native executables**. For us the wins are **memory per pod** and **startup time**. We run many small services across five tenants and five environments, and we scale out on spikes with KEDA, so a pod that starts in well under a second and runs in a fraction of the memory of a Spring Boot JVM means cheaper clusters and faster scale-out. Quarkus does most of its framework work at **build time** (dependency injection, annotation scanning, config), which is also what makes native compilation practical. We kept the big orchestration service, checkout biz, on Spring Boot WebFlux for now, because it's large, CPU-heavier and long-running, so it benefits from the JIT, and a rewrite carries more risk."

### What the code shows (evidence) {#what-the-code-shows-evidence}

<a id="shared-5e31f5f33e62"></a>

| Fact | Evidence |
|---|---|
| **Checkout app tier was migrated from Spring Boot to Quarkus** in July 2026 under one Jira ticket, with follow-ups for a framework update and for error handling | (code) git history of the checkout app service ("spring to quarkus migration", "quarkus error handling"); now on `main` |
| **Quarkus services:** checkout app tier; fulfillment app, data and event services; **order app and data services**; taxation data service; CSP app and data. All on Quarkus 3.33, Java 21, all built native | (code) `gradle.properties`, Dockerfiles |
| **Still Spring Boot 3:** checkout biz (WebFlux), checkout data, EOM adaptor (cart and product per their docs; order event and job services are not Quarkus) | (code) Gradle builds |
| **All Quarkus services ship as native executables**: Docker stage 1 uses a Quarkus/GraalVM builder image and runs `gradlew build -Dquarkus.native.enabled=true -Dquarkus.package.jar.enabled=false`; stage 2 copies only the `*-runner` binary into a small runner image. Spring services ship a fat jar on a JVM image | (config) `ci-config/Dockerfile` in each repo |
| **Extensions used:** Quarkus REST (RESTEasy Reactive) + Jackson, MicroProfile REST Client, Mutiny, YAML config, SmallRye Health, Micrometer/Prometheus, OpenTelemetry. The platform team ported its starters to Quarkus (core, auth, master data, feature toggles) | (code) `app/build.gradle.kts` |
| **Native-specific work:** classes annotated `@RegisterForReflection`; a built-in Jackson exception mapper disabled to keep the error contract | (code) |
| **Tuning added in the migration:** Vert.x event loops 64, HTTP I/O threads 64, REST client connection pool 500; config mounted via `QUARKUS_CONFIG_LOCATIONS`; health probes moved from Spring actuator to `/q/health/started`, `/live`, `/ready` | (config) Helm values |
| **Pod sizes:** most Quarkus services request 100–250m CPU and 500 Mi memory (fulfillment and taxation limits 250–500m CPU). Spring checkout biz runs with 2 GiB and heap at 50–70% of RAM | (config) Helm values |

**Be honest about two leftovers (good "what I'd improve" points):**

<a id="shared-cd7fc6c66354"></a>

- In THA and LATAM prod the **Quarkus checkout app tier still requests 2 GiB**, the same as before the migration, so the memory saving is not yet harvested there. Right-sizing from real RSS metrics is the obvious next step.
- `JAVA_TOOL_OPTIONS` with heap percentages is still set for the app tier. A native executable does not read that variable, so it has no effect; native heap is controlled with `-Xmx` on the binary or by default from container memory.

<a id="shared-da4fb5ce1ae8"></a>

**Not in the workspace:** measured startup times, RSS, or before/after cost numbers, and the written decision record for the migration. Don't quote numbers as "ours". Use the general figures below as "typical".

### General Quarkus facts (not from our code; say "typically") {#general-quarkus-facts-not-from-our-code-say-typically}

<a id="shared-fefc2e4e99e1"></a>

| Topic | What to say |
|---|---|
| **Build-time processing** | Quarkus moves work that Spring does at startup (classpath scanning, reflection, proxy generation, bean wiring with its CDI implementation ArC, config parsing) to the build. The app starts with an already-wired object graph. |
| **Startup** | JVM mode typically starts in around 1 second; native in tens of milliseconds. A typical Spring Boot service on the JVM takes several seconds to tens of seconds depending on size. |
| **Memory** | Native executables typically use tens of MB of RSS at idle versus a few hundred MB for a comparable Spring Boot JVM app. No JIT compiler, no class metadata loaded at runtime, smaller heap. |
| **Image size** | Native binary plus minimal base image is small; no JDK in the runtime image, which also reduces the attack surface. |
| **Reactive core** | Built on Vert.x and Netty with Mutiny (`Uni`/`Multi`). RESTEasy Reactive runs handlers on the I/O thread unless marked `@Blocking`. |
| **Developer experience** | Dev mode with live reload, Dev Services (auto-started containers for Postgres, Kafka, Redis in tests), continuous testing. |
| **Standards** | Jakarta REST, CDI, MicroProfile Config, Health, REST Client, Fault Tolerance, OpenTelemetry. |
| **Kubernetes** | Extensions to generate manifests, health endpoints, config from ConfigMaps. |

### Trade-offs of Quarkus native (interviewers like this part) {#trade-offs-of-quarkus-native-interviewers-like-this-part}

<a id="shared-dd8cfffb70dc"></a>

- **Long and heavy builds:** native compilation takes minutes and several GB of RAM (our pipeline uses large CodeBuild compute for image builds).
- **Closed-world assumption:** reflection, dynamic proxies, resources and serialisation must be known at build time. Libraries that rely on runtime reflection need registration (`@RegisterForReflection`, config files) or don't work.
- **Peak throughput:** a warmed-up JIT on the JVM can outperform a native binary for long-running CPU-heavy work. Native wins on startup and memory, not always on raw throughput. Native images also have more limited GC options (Serial GC by default in the community edition).
- **Tooling:** profiling and debugging native binaries is harder; some JVM agents don't work.
- **Ecosystem and skills:** smaller than Spring's; Spring knowledge doesn't transfer one-to-one (Reactor → Mutiny, `@RestController` → JAX-RS, actuator → SmallRye Health). Our follow-up "error handling" fixes are an example: exception mapping behaves differently.
- **Behaviour differences** between JVM tests and the native binary: you need native integration tests to catch them.

### Why it fits our architecture (reasoned) {#why-it-fits-our-architecture-reasoned}

<a id="shared-0f605c5d2585"></a>

1. **Many small services × tenants × environments:** memory is the dominant cost of a Kubernetes cluster full of JVMs. Cutting per-pod memory multiplies across dozens of deployments.
2. **Scale-out on spikes:** KEDA adds pods on month-end and flash-sale signals; the new pod is only useful once it passes readiness. Sub-second startup makes scaling responsive and lets you run fewer idle replicas.
3. **Thin, I/O-bound tiers:** app tiers and data services mostly validate, map and call other services or databases. They gain little from the JIT and a lot from a small footprint and non-blocking I/O.
4. **Faster rollouts and recovery:** rolling deployments and pod restarts finish faster.
5. **Smaller attack surface:** no JDK in the runtime image.

### Why checkout biz stayed on Spring Boot (reasoned) {#why-checkout-biz-stayed-on-spring-boot-reasoned}

<a id="shared-9a4c6b43b9ec"></a>

- Largest service: ~45 handlers built on Project Reactor (`Mono`, `Flux.merge`, `Mono.zip`). Moving to Mutiny is a rewrite of every handler, with regression risk on the money path.
- It is the longest-running, CPU-heaviest service (pricing, promotions, tax orchestration), where JIT warm-up pays off.
- Incremental migration starting with thin services is the low-risk path; the app tier proved the tooling first.

### Likely follow-ups {#likely-follow-ups-9}

<a id="shared-5d24c0740426"></a>

- **"Spring Boot 3 also supports GraalVM native (Spring AOT). Why not that?"** It's a valid option now. Quarkus was designed build-time-first, so more of its extensions work natively out of the box, and the platform team had already built Quarkus starters. Other options to mention: Class Data Sharing / AppCDS, CRaC (checkpoint/restore), or Spring's lazy init, which reduce startup without native.
- **"What did the migration involve?"** Controllers to JAX-RS resources, WebClient to MicroProfile REST clients, Reactor to Mutiny, Spring config to MicroProfile/YAML config, actuator to SmallRye Health (probe paths changed), Spring tests to `@QuarkusTest`, reflection registration for native, re-checking error mapping so the API contract (status codes and error bodies) stayed identical.
- **"How did you verify nothing broke?"** The API contract is generated from the same OpenAPI spec, so request/response shapes are fixed. Then tests, QA/UAT regression and error-handling fixes found after release. Say only what you personally saw.
- **"Native vs JVM mode: when would you choose JVM?"** CPU-heavy long-running services, libraries that don't work natively, or when build time matters more than startup.
- **"How do you measure the benefit?"** Startup from the startup-probe timing or pod events; memory from container RSS (Prometheus/Dynatrace); cost from node count after right-sizing requests.
- **"How does reactive work in Quarkus?"** Vert.x event loops; endpoints returning `Uni`/`Multi` run non-blocking on I/O threads; blocking work goes to worker threads with `@Blocking` (fulfillment's Kafka consumers use it).

---

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
