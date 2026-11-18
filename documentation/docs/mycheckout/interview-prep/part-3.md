---
slug: /mycheckout/interview-prep/part-3
title: "mycheckout — Checkout Platform: Interview Preparation — Part 3"
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

# mycheckout — Checkout Platform: Interview Preparation — Part 3

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `INTERVIEW-PREP.md` |
| Source SHA256 | `d66d6ba6319504f369415902a6e00eb5d3899fda752d33ddc02b69eb911129ef` |
| Guide part | 3 of 7 |

[Part 1](/mycheckout/interview-prep/part-1) · [Part 2](/mycheckout/interview-prep/part-2) · [Part 3](/mycheckout/interview-prep/part-3) · [Part 4](/mycheckout/interview-prep/part-4) · [Part 5](/mycheckout/interview-prep/part-5) · [Part 6](/mycheckout/interview-prep/part-6) · [Part 7](/mycheckout/interview-prep/part-7)

## Q5. How do we handle traffic spikes? {#q5-how-do-we-handle-traffic-spikes}

### Say this {#say-this-4}

<a id="shared-21ac70c81672"></a>

> "Our spikes are predictable: **month-end** (the business closes volume periods) and **flash sales**. So checkout biz uses **KEDA** with three triggers: CPU at 75%, plus two external queue-based triggers for month-end and flash-sale signals, which let us **scale out before CPU rises**. In prod it runs between 2 and 15 replicas per tenant. Behind that, Kafka acts as a **buffer**: checkout can accept orders faster than EOM and the warehouse process them, and those consumers catch up. Timeouts, idempotency keys and retry/dead-letter topics keep a spike from turning into a cascade."

### Go deeper {#go-deeper-3}

<a id="shared-75f3ee1e6969"></a>

- **KEDA (config, prod values):** min 2 (3 in one tenant) to max 15 replicas; CPU 75%; an SQS-queue scaler for month-end (factor 6) and one for flash sales (factor 8). Plain HPA is defined but disabled where KEDA is on. Pods have 0.5–1 CPU (more in one tenant), 2 GiB, JVM heap 50–70% of container memory.
- **Probes:** startup, liveness and readiness on Spring actuator endpoints, so new pods only take traffic when ready.
- **Data tier:** DynamoDB scales by capacity mode (prod mode not visible here); Aurora Serverless v2 scales ACUs automatically.
- **Back-pressure and isolation:** per-dependency timeouts; mesh SLA timeout 22 s for biz; Istio in front; network policy limits who can call biz.
- **Async absorption:** CDC Lambda connectors read the DynamoDB stream in batches of 50–60 with parallelisation factor 3; consumers have retry (RLQ) and dead-letter (DLQ) topics, so a poison message doesn't block a partition.
- **Duplicate-click protection:** idempotent create, optimistic version on place order, and a "skip step" window that avoids recalculating if the checkout was updated a moment ago.

### What the code shows vs. why {#what-the-code-shows-vs-why-4}

<a id="shared-53da8d93bf0e"></a>

- **Shows:** the KEDA config and values above. **Not shown:** what puts messages on the month-end and flash-sale queues (defined outside this workspace), and any load-test results.
- **Reasoned:** queue-based triggers are a way to **pre-warm** capacity on a business signal, because JVM pods take time to start and CPU-based scaling reacts too late for a sale that starts at a fixed time.

### Trade-offs {#trade-offs-3}

<a id="shared-2b6b971c294d"></a>

- Max 15 replicas caps throughput; downstream services (payment, promotion) must scale too or biz just waits faster.
- The hand-off topics have **3 partitions** in Japan prod and connector concurrency of 1, so during a flash sale the delay to EOM grows even if checkout keeps up. It's a lag, not data loss.
- JVM cold start: the reason pre-scaling matters.

### Likely follow-ups {#likely-follow-ups-4}

<a id="shared-3ee5e1417217"></a>

- **"What happens if payment slows down during a sale?"** Calls time out at 15 s, place order returns a failure modification, reservation is released; the customer can retry. I'd add a circuit breaker and a queue-based "order accepted, payment pending" mode for extreme peaks.
- **"Rate limiting?"** Not visible in service code; likely at the gateway/edge. Say so.
- **"How would you load test?"** Replay a month-end traffic shape against perf (a perf environment exists, with a mock server for downstream services), watch p99 latency, DynamoDB throttles, consumer lag.

---

## Q6. Why are services broken into app, biz and data tiers? {#q6-why-are-services-broken-into-app-biz-and-data-tiers}

### Say this {#say-this-5}

<a id="shared-a8cedb5e1c5d"></a>

> "Each tier has one job. The **app tier** is the client-facing façade: validation, authorisation with OPA, mapping to the public contract, and it's the only tier on the partner and public gateways that clients are supposed to use. The **biz tier** is pure orchestration: the per-market handler pipeline that calls 25-odd services, with no storage of its own. The **data tier** owns the tables, and enforces idempotency, versioning and the change stream. That lets us scale them independently, give them different security boundaries, reuse biz from other callers, and change storage without touching business logic."

### Go deeper {#go-deeper-4}

<a id="shared-ae2ca007f40c"></a>

- **Evidence (code/config):** separate repos and deployables per tier; separate contracts (`checkout-app-rest`, `checkout-biz-rest`, `checkout-data-rest`) generated into server stubs and clients; Backstage metadata labels each service with `tier: app | biz | data`; separate IAM service-account role per service; Kubernetes network policy lists exactly which services may call biz (checkout app, EOM adaptor, order app, subscription, fulfillment app, account search, booking, and a few others).
- **Reuse:** biz is called not just by checkout app but by the EOM adaptor (to re-trigger place order on async payment), subscriptions, order app and others. The app tier is specific to the storefront.
- **Scaling:** biz is the heavy one (KEDA, up to 15 replicas); the data tier is thin CRUD.
- **Security:** OPA is enabled at the app tier and disabled in biz, which relies on the app tier plus network policy.
- **Plus event (`es`) and job (`js`) services** for Kafka consumers and CronJobs, and an `-api` repo per domain holding only contracts, flags and master data schemas.

### What the code shows vs. why {#what-the-code-shows-vs-why-5}

<a id="shared-90ccc8c083fc"></a>

- **Shows:** the split, contracts, labels, network policy, per-tier OPA settings.
- **Reasoned:** an org-wide platform standard (every domain follows it, and the deployment pipeline reads tier metadata), team ownership boundaries, and a way to keep the database private to one service ("database per service").

### Trade-offs {#trade-offs-4}

<a id="shared-aa90f2150b35"></a>

- **Extra network hops** (client → app → biz → data) and more latency per request.
- More deployables, pipelines and contracts to version; a lot of DTO mapping (MapStruct).
- A thin app tier can feel like boilerplate. In checkout the app tier is mostly validation, OPA and mapping, plus preorder endpoints.
- Security depends on the tiers being enforced; if biz is reachable directly, the app-tier checks can be bypassed (see Q9).

### Likely follow-ups {#likely-follow-ups-5}

<a id="shared-26db083955ad"></a>

- **"Isn't that a distributed monolith?"** The risk is there if tiers deploy in lockstep. Versioned contracts in a separate repo and Kafka between domains reduce coupling. Within a domain, the tiers do change together often; I'd be honest about that.
- **"Why not one service with layers inside?"** Simpler and faster per call. The split pays off when callers other than the UI need biz, and when tiers scale very differently. For a small team, I'd start with a modular monolith.
- **"How do you share code across tiers?"** Generated clients from contracts, shared starters (feature flags, master data, framework).

---

## Q7. Why do we use Kafka in the architecture? {#q7-why-do-we-use-kafka-in-the-architecture}

### Say this {#say-this-6}

<a id="shared-54f96f3d874e"></a>

> "Kafka is the backbone between domains. One order event has several consumers: the EOM system, fulfillment (to consume or release stock), and order history (archive and index). Kafka lets checkout publish once and not know who listens, it **buffers** spikes, it lets consumers **replay** after a bug fix, and it keeps per-key **ordering**. Events are **Avro in CloudEvents** with a schema registry, so contracts are enforced. And we feed it mostly through **CDC**: DynamoDB streams and Postgres logical replication publish changes, which avoids the dual-write problem."

### Go deeper {#go-deeper-5}

<a id="shared-7e3c419e3f29"></a>

- **Main flows (E2E §13):** checkout raw (checkout → EOM adaptor); sales order published (adaptor → EOM, fulfillment, order history); sales-order payments (payment/EOM → adaptor, order history); stock level raw and inventory availability (fulfillment ledger → product/search); address, contact and registration events into the adaptor; product and price CDC into the product publish service.
- **Naming:** `commerce_<env>_<tenantCode>_<entity>_<raw|pub|error>_v<N>`: `raw` = internal change events, `pub` = published domain events for other domains, `error` = retry/dead-letter.
- **Reliability:** consumers send failures to an RLQ (retry) topic, a scheduled consumer retries it (every few hours, up to 3 attempts), then a DLQ. The adaptor treats "already exists" as success, so replays are idempotent. Order history consumes in batches with manual ack.
- **Ops control:** an endpoint can start or stop a consumer binding at runtime.

### What the code shows vs. why {#what-the-code-shows-vs-why-6}

<a id="shared-2b6c99b9c96c"></a>

- **Shows:** bindings, topics, Avro/CloudEvents, schema subjects, RLQ/DLQ handling, CDC connectors.
- **Reasoned:** fan-out to several consumers, temporal decoupling from an external system (EOM) that has its own availability, replay for recovery, and an org standard (Kafka with ACLs managed in infrastructure code per service account).

### Trade-offs {#trade-offs-5}

<a id="shared-ab2e127c2217"></a>

- **Eventual consistency:** order history and EOM lag behind checkout.
- **At-least-once:** every consumer must be idempotent.
- **Partition count limits parallelism** (3 partitions on the hand-off topics in Japan prod means at most 3 consumers per group).
- Operational cost: schemas, consumer lag, DLQ triage.

### Likely follow-ups {#likely-follow-ups-6}

<a id="shared-934febee442d"></a>

- **"Why not SQS/SNS?"** SNS+SQS does fan-out too, but Kafka adds replay from offset, ordering per key, long retention and a schema registry. SQS is simpler for single-consumer work queues (and is used for the scaling signals).
- **"How do you guarantee ordering?"** Per partition only; events for the same entity need the same key. I'd say I haven't verified the exact key used on every topic.
- **"Exactly-once?"** Not end to end; we use at-least-once plus idempotent consumers, which is the practical standard.
- **"What's in a DLQ, and who looks at it?"** Validation failures and exhausted retries; runbooks describe republishing after fixing the data.

---

## Q8. What is our deployment approach (complete cycle)? {#q8-what-is-our-deployment-approach-complete-cycle}

### Say this {#say-this-7}

<a id="shared-4b0f7b0b738f"></a>

> "It's GitOps on AWS. A developer opens a PR; **GitHub Actions** runs build, unit tests with coverage, Checkstyle, Sonar, a Docker build check and a CDK diff, all from shared reusable workflows. On merge to main, a post-merge workflow runs, and an **AWS CodePipeline** for the service, itself defined in **CDK**, builds the image in **CodeBuild** with a multi-stage Dockerfile and pushes to **ECR**. Deployment to **EKS** is through a shared **Helm chart** with per-tenant, per-environment values, synced by **Argo CD**. Promotion goes dev → QA → UAT → prod for each tenant, with **manual approval** gates and Slack notifications. Infrastructure (DynamoDB, Aurora, CDC connectors, Kafka ACLs) is also CDK, config is configmaps plus AWS AppConfig, flags are flagd, secrets come from SSM Parameter Store, and alerts are Dynatrace monitoring-as-code."

### Go deeper: the cycle step by step {#go-deeper-the-cycle-step-by-step}

<a id="shared-de7aefb3e6f5"></a>

| Step | What happens | Evidence |
|---|---|---|
| 1. Branch & PR | Feature branch to `main` (or `hotfix/**`). Jira key in branch names | (config) workflow triggers; branch names |
| 2. PR checks | Reusable workflows from a central org repo: Gradle build, test report, Checkstyle, JaCoCo, SonarScanner, Docker build validation, CDK diff and CDK deploy check. Dependabot config and auto-merge workflows exist | (config) `.github/workflows/*.yml` |
| 3. Merge | `post-merge` workflow on push to `main`/`hotfix/**` (Sonar not skipped) | (config) |
| 4. Pipeline trigger | Service CodePipeline watches changes in `source/`, `infra-as-code/`, `ci-config/`, `deployment-config/`, `policies-as-code/`, `app-config/`. The pipeline is **self-mutating** CDK (`pipelinePathForMutation`) | (config) `app-pipeline/configs/pipeline.yaml` |
| 5. Build image | CodeBuild runs `ci-config/Dockerfile`: stage 1 builds with Gradle, pulling internal libraries and contract artifacts from **CodeArtifact**; stage 2 copies the jar and config into a slim Java runtime image. Large compute for image build; x86 and ARM compute types are configured | (config) Dockerfile, `pipelineconfig.ts` |
| 6. Push & tag | Image pushed to ECR; a tagging stage exists | (config) pipeline config |
| 7. Deploy | Shared Helm chart (`ngcom-microservice`) with `values-common.yaml` + `values-<tenant>-<env>.yaml`; Argo CD app selected by label | (config) `deployment-config/`, Backstage `argocd/app-selector` annotation |
| 8. Promote | Tenants global, jpn, latam, tha, ap2; envs dev, qa, uat, perf, prod. `approvalRequired` defaults to true per environment (perf has it off), approvals and notifications go to Slack channels | (config) `pipelineconfig.ts` |
| 9. Runtime config | Configmaps mounted at `/etc/app/config/`, AppConfig agent enabled, flagd feature flags, SSM secrets mounted as env, IRSA role per service | (config) Helm values |
| 10. Verify | Startup/liveness/readiness probes; smoke-test framework (`test-as-code`, CodeBuild-run); Prometheus scrape annotations; Dynatrace alerts per tenant (`monitoring-as-code`, Terraform/CDKTF) | (config) |
| 11. Hotfix | Manual workflow creates a hotfix branch from a release tag with a Jira id; a separate hotfix pipeline deploys it | (config) workflow + CDK stack |
| 12. Other pipelines | An "ephemeral" pipeline stack and a "MAC" pipeline stack are also defined | (config) CDK; purpose not visible |

### Where evidence is missing (say this if asked) {#where-evidence-is-missing-say-this-if-asked}

<a id="shared-eed57f9e92be"></a>

- The **actual stage definitions** (build → deploy dev → approval → …) live in shared CDK construct packages and the central GitHub workflows repo, which are **not in this workspace**. The table above is assembled from the configuration that feeds them.
- The **Helm chart itself** isn't here, so the **rollout strategy** (rolling update vs. canary/blue-green via Argo Rollouts) is not visible. Default Kubernetes behaviour would be a rolling update gated by readiness probes.
- **Smoke tests** for checkout biz are still the generated placeholder, configured only for global dev. Don't claim automated post-deploy tests in prod.
- **Rollback**: not documented here; with Argo CD it would be reverting the values/image tag in Git or syncing a previous revision.

### Trade-offs {#trade-offs-6}

<a id="shared-3a1759d52d21"></a>

- Central reusable workflows and constructs give consistency across hundreds of services, but a change in the shared pipeline affects everyone, and service teams have less control.
- Manual approvals slow delivery but suit multi-market retail with business-critical periods.
- Feature flags (45 for checkout) decouple deploy from release: code can ship dark and be turned on per tenant.

### Likely follow-ups {#likely-follow-ups-7}

<a id="shared-c967de3b606a"></a>

- **"How do you release safely?"** Flags per tenant, approvals per environment, readiness probes, alerts. I'd add canary analysis on error rate and p99.
- **"How do you handle DB migrations?"** Flyway for Postgres (checkout addresses); DynamoDB is schemaless so changes are additive and handled in code (version-tolerant mapping).
- **"How do you manage config across 5 tenants × 5 envs?"** Layered values: common + tenant/env overrides, for Helm and for app configmaps.

---

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
