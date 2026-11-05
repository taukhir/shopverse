---
title: "Amway Checkout Architecture Overview"
description: "An illustrated reference architecture connecting checkout workflow, service ownership, generated contracts, persistence, delivery, and observability."
sidebar_label: "Architecture Overview And PNG"
page_type: Guide
difficulty: Intermediate
status: maintained
prerequisites: [HTTP fundamentals, Basic microservice concepts]
learning_objectives:
  - Explain the checkout request and workflow responsibilities
  - Separate runtime integrations from contract generation and delivery
  - Identify reconstructed evidence and architecture assumptions needing confirmation
technologies: [Java, Quarkus, Spring, OpenAPI, MapStruct, PostgreSQL, DynamoDB, Argo CD, Dynatrace]
last_reviewed: "2026-10-20"
scope: generic
owner: docs-architecture
reviewer: documentation-maintainers
review_evidence: existing-amway-notes-and-official-reference-review
visual_required: true
---

# Amway Checkout Architecture Overview

This architecture learning map brings together the existing Amway checkout notes.
Read it from the request path through supporting runtime components, then through
the contract and delivery processes that produce the running application.

<DocCallout type="mistake" title="Reference model from existing notes">

This is a repository-created illustration, not an official Amway architecture
diagram or verified production topology. The workflow notes reconstruct supplied
screenshots; the technology and delivery guides interpret a reported stack.
The Spring/Reactor execution path and the Quarkus stack may describe different
modules. Confirm their ownership before combining them into an implementation.

</DocCallout>

## Architecture PNG

![Four-band Amway checkout reference architecture showing request validation, DTO mapping, provider-factory-strategy handler execution, service-owned data and integrations, generated OpenAPI artifacts, and delivery through CI, AWS tooling, Argo CD, and runtime verification.](/img/diagrams/amway-checkout-architecture.png)

**How to read it:** solid arrows show logical runtime relationships. Dashed arrows
show supporting configuration, telemetry, build, or delivery relationships. All
connections are explanatory; the bands do not imply separate deployed services.
The prose below provides the same information without relying on color or image
readability.

[Open the full-resolution PNG](/img/diagrams/amway-checkout-architecture.png)
or [the scalable SVG](/img/diagrams/amway-checkout-architecture.svg).

## Evidence Behind The Picture

| Diagram area | Existing source | Confidence and limitation |
|---|---|---|
| Controller, mapping, common request, handler pipeline | [Create-checkout walkthrough](./AMWAY-CREATE-CHECKOUT-FLOW.md), especially Executive Flow | Screenshot reconstruction; current internal source was not inspected |
| Provider, tenant factory, strategy | [Factory and provider](./AMWAY-CHECKOUT-FACTORY-PROVIDER.md), [strategy](./AMWAY-CHECKOUT-STRATEGY-PATTERN.md) | Reconstructed design; exact registrations and fallback behavior need confirmation |
| Quarkus, data stores, HTTP clients, flags, configuration | [Technology-stack inventory](./AMWAY-PROJECT-TECH-STACK.md) | Reported technologies; runtime connections and storage responsibilities are inferred |
| Generated contracts and shared artifacts | [Contract-artifact tutorial](./AMWAY-OPENAPI-CONTRACT-ARTIFACTS.md) | Illustrative build/release model, not a verified internal publication pipeline |
| AWS stages, Argo CD, Dynatrace | [Delivery and observability](./AMWAY-DELIVERY-OBSERVABILITY.md) | Reported tools; handoffs and Kubernetes/EKS topology require verification |

No internal hostnames, repository coordinates, customer payloads, cloud account
identifiers, or credentials are needed to understand this diagram.

## 1. Request Entry And API Boundary

A web or mobile client submits a checkout request. The API boundary validates its
shape, establishes caller identity, and enforces access to referenced resources.
The exact edge topology and authentication placement are conceptual in this map.

The existing execution notes name `CheckoutController.createCheckout`,
`ValidatorUtil`, and `CheckoutRequestBizDtoValidator`. These names come from the
reconstructed walkthrough, not from runnable ShopVerse service source.

Generated API DTOs describe transport. Validation and authorization still need
runtime implementation and tests. An OpenAPI security declaration is descriptive;
it does not establish resource ownership. For API description tooling, see
[Quarkus OpenAPI and Swagger UI](https://quarkus.io/guides/openapi-swaggerui).

## 2. Mapping And Workflow Context

The walkthrough maps API input into `CheckoutBizDto` and builds a
`CheckoutCommonRequest`. This separates public JSON representation from the data
used to execute a market-specific checkout workflow.

MapStruct can generate the repetitive Java conversion and invoke handwritten
helpers. It does not define valid order transitions or compute authoritative
prices by itself. See [the MapStruct guide](../java/MAPSTRUCT-DEEP-DIVE.md).

Treat common context as per-request state. Determine which handlers read and
write each field before permitting concurrent execution. A shared mutable context
can introduce races even when every individual handler looks correct.

## 3. Provider, Factory, Strategy, And Handler Execution

These responsibilities form the central workflow model:

| Component | Question answered |
|---|---|
| Workflow-family provider | Which family of workflow factories applies? |
| Tenant/country factory | Which strategy applies for this tenant or market? |
| Strategy | Which handler plan should execute for this request and flow? |
| Pipeline builder | How do handler keys become ordered executable stages? |
| Executor | How are those stages invoked and failures propagated? |

The notes describe `StepHandlerStrategyFactoryProvider`,
`CheckoutStepHandlerTenantStrategyFactory`, handler keys,
`keyBasedHandlerPipeline.buildList`, and `HandlerExecutor.buildAndExecute`.
See the [execution guide](./AMWAY-CREATE-CHECKOUT-FLOW.md) for the reconstructed
sequence rather than inferring a full handler list from this overview.

Stage configuration alone does not prove parallel execution. Check subscription,
dependency ordering, context mutation, cancellation, and failure behavior in the
actual executor. Successful execution eventually prepares a public response;
failure paths need explicit error translation and recovery semantics.

## 4. Runtime Integrations And Data Ownership

The reported stack includes typed HTTP clients for other service boundaries.
Account, profile, pricing, inventory, and payment are potential collaborators;
the diagram does not assert that every checkout calls each one, or that a fixed
synchronous sequence connects them.

Each collaborator remains responsible for its own business facts and data.
Checkout should consume an approved API instead of querying another service's
database. Define timeout budgets, caller identity propagation, error mapping, and
safe retry behavior for each integration.

PostgreSQL/RDS and DynamoDB appear in the technology inventory. Their placement
beside checkout represents proposed service-owned persistence, not evidence that
each request writes both stores. Confirm aggregate ownership, access patterns,
migration tooling, transaction scope, and consistency requirements. A successful
write to one store does not establish atomicity across both.

OpenFeature/flagd represents feature evaluation; SSM represents configuration;
Dynatrace represents telemetry. These are different responsibilities. Confirm
their adapters and data flow before treating the support arrow as a deployed
connection.

## 5. Contract And Build Responsibilities

The contract band shows an illustrative contract-first workflow:

1. The provider owns and reviews an OpenAPI document.
2. A pinned generator produces selected models, clients, or provider interfaces.
3. The build compiles and tests generated output.
4. Approved artifacts are published with immutable versions.
5. Providers and consumers select compatible versions and map transport models
   into their own application types.

These arrows describe build-time dependencies. They are not checkout network
calls. The artifact repository also does not become a shared domain database.

For code-first APIs, implementation metadata instead produces the description.
Swagger UI renders that document; it does not implement the business API.
See [contracts across services](./OPENAPI-SWAGGER-SERVICE-CONTRACTS.md) for both
directions of generation and [the artifact tutorial](./AMWAY-OPENAPI-CONTRACT-ARTIFACTS.md)
for build details.

## 6. Delivery And Observability

The reported delivery tools fit a reference sequence: GitHub Actions validates a
revision, Gradle/JaCoCo/SonarQube supply quality evidence, an approved AWS pipeline
handles promotion, and Argo CD reconciles desired Kubernetes state. Dynatrace and
smoke checks supply runtime verification.

This is a proposed division of responsibility. It does not prove how GitHub and
CodePipeline hand off artifacts, whether CodeBuild rebuilds them, or whether the
cluster is Amazon EKS. Inspect workflow files, buildspecs, infrastructure code,
GitOps manifests, and deployed application configuration.

Argo CD's role is Kubernetes reconciliation from declarative configuration;
application health and a successful sync still need business-level verification.
See [Argo CD declarative setup](https://argo-cd.readthedocs.io/en/stable/operator-manual/declarative-setup/)
and [the delivery guide](./AMWAY-DELIVERY-OBSERVABILITY.md).

### CI/CD Pipeline PNG

The user reports pushing source to GitHub, using GitHub Actions and AWS pipelines,
running on AWS Kubernetes, and using Argo CD. The image below makes the missing
handoffs explicit. Amazon EKS is the likely product meant by AWS Kubernetes;
confirm that name in the cluster configuration. ECR, stage ownership, deployment
repository layout, and approval settings remain proposed details.

![Amway CI/CD reference flow: GitHub source and Actions feed a gated AWS pipeline, an approved build publishes an immutable image, deployment configuration in Git records its digest, and Argo CD reconciles AWS Kubernetes before readiness, smoke, and Dynatrace checks.](/img/diagrams/amway-cicd-pipeline.png)

[Open the CI/CD PNG](/img/diagrams/amway-cicd-pipeline.png)
or [the scalable CI/CD SVG](/img/diagrams/amway-cicd-pipeline.svg).

**The distinction:** Git stores version history; GitHub hosts repositories;
GitHub Actions executes workflows; GitOps records desired deployment state in
Git and reconciles it into an environment. GitOps is not an additional GitHub
service that automatically triggers AWS.

The proposed flow is:

1. Push a branch or open a pull request; required GitHub Actions checks validate it.
2. After the approved event, AWS CodePipeline promotes the selected revision.
3. An explicitly owned build stage creates and tests the container image, then
   publishes it to ECR or the team's actual image registry.
4. Release automation proposes an update to the image digest in Helm values,
   Kustomize, or Kubernetes manifests tracked in Git. The configuration can live
   in a separate repository or an explicitly selected application-repository path.
5. Argo CD reads that configuration and compares it with the live cluster.
   Automatic sync or an approved manual sync applies the desired resources.
6. Kubernetes runs the workloads, pulls the referenced image through its runtime,
   and uses readiness checks to control readiness. Smoke tests and Dynatrace
   determine whether the release meets operational and business expectations.

This is the GitOps deployment model used in the image. In that model, AWS stages
prepare and promote desired state, while Argo CD reconciles application resources.
CodePipeline can also deploy directly to EKS; that is a supported alternative.
If it does so in your project, establish which resources it owns and which Argo
CD owns. Two independent writers managing the same Deployment can create drift.
See [AWS EKS deployment actions](https://docs.aws.amazon.com/codepipeline/latest/userguide/tutorials-eks-deploy.html).

### Gaps To Confirm In The Reported Flow

These are gaps in our current explanation, not evidence that the internal system
lacks the controls.

| Question | Why it matters | Where to verify |
|---|---|---|
| Does Actions start AWS, or does AWS independently watch GitHub? | Parallel triggers can deploy before CI passes or deploy the same revision twice | `.github/workflows`, CodePipeline source trigger, required checks |
| Which stage owns build and image publication? | Prevents an unverified rebuild from replacing the tested artifact | Buildspec, Actions jobs, source SHA and digest outputs |
| Which registry stores the image? | Kubernetes needs a retrievable image and pull authorization | Image push destination, workload image reference, IAM/pull configuration |
| Who updates deployment Git state after image publication? | A new image alone does not cause Argo CD to select it | Config-change PR, manifest path, Helm values, release automation |
| Who applies application resources? | Distinguishes direct AWS deployment from Argo CD reconciliation | AWS deploy stage and Argo CD Application destination/resources |
| Is sync automatic, manual, or approval-gated? | Determines when the Git change becomes a running release | Argo CD sync policy, environment approvals, sync windows |
| How does AWS access work? | CI and workloads need distinct, appropriately scoped identities | GitHub OIDC/connection setup, IAM roles, Kubernetes RBAC |
| How are dev/test/prod promoted and recovered? | Preserve artifact identity and an auditable recovery path | Environment config, image digests, promotion and rollback runbooks |
| What proves release success? | Argo sync alone does not prove checkout works | Readiness, smoke tests, telemetry and error/latency checks |
| How do schema changes coexist with old workloads? | Reverting an image cannot safely undo every database change | Migration ownership, compatibility tests, recovery procedure |

AWS supports a GitHub source connection, so an Actions-to-AWS API call is not the
only possible trigger. If AWS watches GitHub directly, explicitly gate promotion
on the required validation result for the same revision.
See [GitHub connections](https://docs.aws.amazon.com/codepipeline/latest/userguide/connections-github.html).

Argo CD can automatically sync when desired state changes; CI does not have to
invoke the Argo CD API in that setup. Conversely, manual sync requires a defined
owner or automation step. See
[Argo CD automatic sync](https://argo-cd.readthedocs.io/en/stable/user-guide/auto_sync/).

For recovery in this reference flow, restore the approved image/configuration
through a reviewed Git change and verify the resulting release. Account for
database compatibility and irreversible side effects separately. Track source
SHA, build identity, image digest, configuration commit, Argo revision, and running
workload together when investigating a deployment.

## Failure And Recovery Questions

| Boundary | Evidence to establish |
|---|---|
| Client retries checkout | Idempotency ownership, duplicate result, in-progress behavior |
| Upstream timeout | Deadline budget, retry eligibility, fallback and error contract |
| Handler fails after a side effect | Persisted progress, retry safety, business compensation |
| Concurrent handler group | Actual overlap, read/write dependencies, cancellation behavior |
| Database operation fails | Transaction boundary and permitted terminal state |
| Contract version changes | Compatibility review and consumer upgrade order |
| Deployment regresses | Revision/image identity, telemetry, rollback or forward-fix procedure |

These are verification questions, not claims that a particular recovery mechanism
exists in the internal project. Correlation identifiers should link the request,
workflow, outbound calls, and telemetry without exposing customer-sensitive data.

## Relationship To ShopVerse

ShopVerse hosts this learning material. Its own architecture requires external
API traffic through `api-gateway`, service-owned databases, and Kafka choreography
for checkout. This Amway reference map does not authorize replacing that flow
with synchronous service calls or sharing a transaction across services.

Use [the ShopVerse architecture overview](./ARCHITECTURE-OVERVIEW.md) when the
question is how the runnable reference application works.

## Maintaining The Diagram

The PNG and SVG are repository-owned generated assets. The editable source is
`documentation/scripts/render-amway-architecture.mjs`. From `documentation/`, run:

```powershell
node scripts/render-amway-architecture.mjs
node scripts/render-amway-cicd.mjs
```

Rendering requires the installed Playwright dependency and its Chromium browser.
Update the diagram and evidence table together; visually inspect regenerated
assets, run documentation checks, and verify the built page before handoff.

## Recommended Next

- [Amway learning path](./AMWAY-NEXT-GEN-CHECKOUT.md)
- [Create-checkout execution](./AMWAY-CREATE-CHECKOUT-FLOW.md)
- [Technology-stack responsibilities](./AMWAY-PROJECT-TECH-STACK.md)
- [Contract generation and consumption](./OPENAPI-SWAGGER-SERVICE-CONTRACTS.md)
- [Delivery and operational evidence](./AMWAY-DELIVERY-OBSERVABILITY.md)
