# CI pipeline and naming review

Date: 2026-11-05 (Asia/Calcutta). Reviewer: Codex, Senior Solutions Architect.

## Scope and outcome

Reviewed all ten `.github/workflows/*.yml` files, Dependabot configuration,
the workflow operations guide, shared Jenkins pipeline, three service Jenkinsfiles,
Gradle verification conventions, Order build inputs, and frontend verification script.
Revision: `8789d99b9dd4e224129bbffb9d0b642ff0e37ba4`, with unrelated existing
changes to the Order, User, and common `gradlew.bat` files preserved.

Outcome: useful foundations, but not ready to describe as an enterprise release
pipeline. Confirmed selection defects and missing release enforcement must be
resolved first. This is an architecture review, not an implemented remediation
or an audit certification. Workflow files and application code were not changed.
The saved guidance-only implementation boundary remains in effect.

Priorities below express delivery/reliability impact, not automatically an
exploitable security vulnerability. Security hardening is distinguished explicitly.
Review structure follows `dev-tools/ai-workflows/templates/review-report.md`;
security assessment follows `dev-tools/ai-workflows/prompts/security-review.md`.

## Findings

### 1. High — full-verification fallback selects no services

- Evidence: `.github/workflows/ci.yml:106-130`, job `changes`, step `detect`.
  Manual runs, first pushes, missing history and failed PR/push diffs assign
  `changed_files="shared-change"`; the subsequent shared-path expression does
  not recognize that marker. Scheduled runs with no `before` SHA use the same path.
- Failure: these events produce no selected services, so the unit, integration,
  and image matrix jobs are skipped. The Compose smoke test may still run on
  master/manual runs, but does not replace those separate test suites.
- Confidence: high; original Bash event/path selection reproduced with fixtures.
- Smallest remediation: use an explicit `run_all` flag, set for schedule,
  dispatch, first push and unavailable diff; combine it with shared-path selection.
  Use two-endpoint `git diff BEFORE HEAD` for push net changes; retain the
  merge-base form for PR comparisons.
- Regression proof: each full-verification case selects eight services and the
  three existing integration suites; failed diff must never become an empty matrix.

### 2. High — root Gradle inputs bypass affected-service verification

- Evidence: `.github/workflows/ci.yml:129` omits `gradle/`.
  `build-logic/settings.gradle:16` and `shopverse-common/settings.gradle:15`
  load `gradle/libs.versions.toml`; `services/order-service/Dockerfile:8`
  copies the root Gradle directory.
- Failure: a version-catalog or Checkstyle configuration change selects no services.
- Confidence: high; catalog-change fixture selected zero services.
- Smallest remediation: add `gradle/` to shared inputs and audit all actual
  compiler, image and verification inputs. Treat unknown diff state as full verification.
- Regression proof: root catalog and Checkstyle changes select all affected services;
  service-only and documentation-only control cases remain selective.

### 3. High — release is independent of security results

- Evidence: `.github/workflows/security.yml:76-83` scans HIGH/CRITICAL findings
  with `exit-code: "0"`; `.github/workflows/deploy.yml:4-10,34` and
  `jenkins-trigger.yml:4-10,29` depend only on completion/success of `Shopverse CI`.
- Failure: publication and optional deployment/handoff can proceed while the
  independent security workflow is running or failing. Trivy findings themselves
  do not fail the scan. This proves an enforcement gap, not that current images
  contain vulnerabilities or that a secret has leaked.
- Confidence: high, from workflow dependency graph.
- Smallest remediation: define a required release gate over verification and
  security results for the same commit. Make the vulnerability policy blocking
  with reviewed, expiring exceptions; preserve SARIF upload even on scan failure.
- Regression proof: a deliberately failing security fixture prevents publishing,
  SSH deployment and Jenkins handoff for that revision.

### 4. High — release rebuilds images and does not preserve one verified artifact

- Evidence: CI builds images without publishing (`ci.yml:256-264`); security
  separately rebuilds (`security.yml:63-74`); release builds again and publishes
  SHA plus `latest` (`deploy.yml:80-88`). Manual deploy defaults to `latest`
  (`deploy.yml:13-16`), interpolates the supplied value into shell source
  (`deploy.yml:103`), and the host executes `git pull` (`deploy.yml:130`).
- Failure: verification, scanning and deployment are not bound to one digest.
  Mutable tags/base images and a host checkout that advances independently can
  produce a different deployed artifact/configuration. Manual dispatch also
  permits publication without the automatic CI-success condition.
- Confidence: high for configuration; no live drift incident was observed.
- Remediation: build a candidate once, scan/test its digest, record source SHA and
  digest in a release manifest, and promote that digest. Validate manual inputs
  via environment variables and allow only verified candidates. Bind deployment
  configuration to the reviewed release revision; add readiness, authenticated
  smoke verification, and a documented rollback to the previous release digest.
- Regression proof: scanned and deployed digests match; an unverified candidate
  is rejected; failed readiness has a rehearsed recovery path.

### 5. High for Jenkins users — stale paths and source identity break handoff

- Evidence: `dev-tools/jenkins/Jenkinsfile:21` uses `dir(service)`;
  lines 97-108 reference root `cloud-configs/` and `observability/`;
  lines 148-149 build `./<service>`. Actual paths are `services/<service>`
  and `infra/...`. User, Order and Discovery Jenkinsfiles repeat the old layout
  (for example `services/user-service/Jenkinsfile:44,62`). Order's Dockerfile
  expects the repository root as build context. `jenkins-trigger.yml:68` sends
  `IMAGE_TAG`; the shared Jenkinsfile checks out SCM independently at line 69.
- Failure: a normal root checkout fails validation/build; fixing paths alone
  could still tag a different checkout with the upstream commit's image tag.
- Confidence: high for stale paths; no live Jenkins configuration was inspected.
- Remediation: use current paths and root Docker context with explicit `-f`;
  pass and verify a separate source revision, or consume the verified image
  manifest rather than rebuilding. Keep Jenkins optional unless it has a defined role.
- Regression proof: fresh-root checkout validates and builds; checked-out SHA
  equals the requested source SHA; publication cannot mislabel another revision.

### 6. Medium — Java quality tools do not enforce quality

- Evidence: `ci.yml:183` runs `test`, not `check`;
  `build-logic/src/main/groovy/io.shopverse.java-service-conventions.gradle:40-47`
  and `shopverse-common/build.gradle` configure Checkstyle/SpotBugs with
  `ignoreFailures = true`. JaCoCo reports exist, but no coverage verification
  task is configured in the reviewed build files. There is no explicit common
  module test job; composite dependency builds do not establish that its tests ran.
- Failure: Java tests passing is not evidence of static-analysis compliance or
  shared-module regression coverage.
- Confidence: high for explicit configuration.
- Remediation: run common module tests explicitly; baseline existing static
  findings, then enforce agreed new-code rules with `check`. Set coverage
  expectations from risk and baseline evidence rather than an invented percentage.
- Regression proof: a representative static violation and failing common test
  fail their required checks; legitimate existing exceptions stay documented.

### 7. Medium — branch and workflow orchestration are inconsistent

- Evidence: most application workflows target `master`, while
  `java-senior-labs.yml:9` targets `main`. `docs-site.yml:41-43` uses one
  cancellation group for all branches/events. CI has dynamic matrix checks and
  no stable aggregate required gate. No workflow declares `merge_group`.
- Failure: Java lab post-merge verification misses master pushes; unrelated docs
  PRs can cancel each other or a publication run. Dynamic/path-filtered checks
  need deliberate branch-rule configuration to avoid missing/pending gates.
- Confidence: high for configuration; default branch and branch rules unverified.
- Remediation: confirm the default branch, align intended triggers, scope CI
  cancellation by workflow/event/PR-or-ref, and isolate deployment serialization.
  Introduce a stable always-evaluated gate that rejects failed/cancelled prerequisites
  and accepts skips only when change detection proves them valid. If merge queue
  is enabled, add `merge_group` with conservative full verification until tested.
- Regression proof: simultaneous docs PRs do not cancel each other; failure,
  cancellation, legitimate no-change and merge-queue cases behave as specified.

## Defense-in-depth recommendations

These are confirmed configuration gaps, not demonstrated compromises:

- All 46 external action references use tags, with zero full-commit SHA pins.
  Pin reviewed revisions and keep Dependabot updates. GitHub recommends full
  SHA pinning: [secure use reference](https://docs.github.com/en/actions/reference/security/secure-use).
- Restrict token permissions per job: Pages write/OIDC permissions currently
  apply to its build job too; package-write applies throughout release.
  `java-senior-labs.yml` has no explicit permissions block.
- For privileged `workflow_run` handlers, explicitly allow only the expected
  upstream repository, event and protected branch. The current branch filter
  alone is not a full trust policy. No exploit was demonstrated in this review.
- Add explicit timeouts to the two release jobs and the Jenkins, dependency,
  Java lab and visual-regression jobs; the latter three also lack concurrency rules.
- Consider dependency review/SAST, workflow linting, SBOM/provenance and signing
  as policy-backed follow-ups. No implementation or account-level enforcement
  was verified. No `.github/CODEOWNERS` file exists in the inspected tree.
- Verify branch rules, workflow owners, required checks, protected production
  environment reviewers and secret scopes in GitHub. Declaring `environment:
  production` in YAML is not proof that approval protection is enabled.

## Proposed naming convention

This is a maintainability proposal, not a correctness requirement or approved rename.
Preserve the brand spelling `ShopVerse`. Filenames use lower-case kebab-case with
purpose prefixes; job IDs use lower-case kebab-case; visible names use clear nouns.
Keep names stable because branch rules, workflow consumers and external tooling
can depend on them. Existing service names already follow a useful convention.

| Current file | Proposed file | Workflow display name |
|---|---|---|
| `ci.yml` | `ci-backend.yml` | `ShopVerse / CI / Backend` |
| `security.yml` | `ci-security.yml` | `ShopVerse / CI / Security` |
| `frontend-sites.yml` | `ci-web.yml` | `ShopVerse / CI / Web` |
| `docs-site.yml` | `docs-verify-publish.yml` | `ShopVerse / Docs / Verify and Publish` |
| `docs-visual-regression.yml` | `ci-docs-visual.yml` | `ShopVerse / CI / Docs Visual` |
| `java-senior-labs.yml` | `ci-java-labs.yml` | `ShopVerse / CI / Java Labs` |
| `database-operations-lab.yml` | `ci-database-lab.yml` | `ShopVerse / CI / Database Lab` |
| `docs-dependency-update.yml` | `maintenance-docs-dependencies.yml` | `ShopVerse / Maintenance / Docs Dependencies` |
| `deploy.yml` | `cd-production.yml` | `ShopVerse / CD / Production` |
| `jenkins-trigger.yml` | `integration-jenkins.yml` | `ShopVerse / Integration / Jenkins` |

Suggested backend job IDs: `validate-config`, `detect-changes`, `test-unit`,
`test-integration`, `build-images`, `test-checkout-saga`, `ci-gate`.
Visible matrix names: `Unit Tests / order-service`, `Integration Tests /
order-service`, `Container Build / order-service`. Artifacts:
`test-unit-order-service-<run-id>-<attempt>`; images retain the service name and
source revision tag, with promotion/deployment using the digest.

Renaming `Shopverse CI` requires updating the exact `workflow_run.workflows`
strings in BOTH deployment and Jenkins handlers. Update workflow self-path
filters, operations documentation and any remote required checks together.
Do not rename `master` merely to make naming consistent; confirm branch policy first.

## Verified strengths

- Core CI declares read-only contents permissions, bounded timeouts and matrix
  parallelism, and disables fail-fast to collect independent service results.
- Compose configuration is validated before service verification.
- Order, Inventory and Payment have explicit Testcontainers integration jobs.
- Checkout SAGA smoke verification invokes the existing authenticated smoke
  script; failure diagnostics are bounded and stack cleanup uses `always()`.
- Frontend script includes production build, unit tests, quick E2E, accessibility
  and Lighthouse checks. Documentation includes content, build and browser checks.
- Dependabot covers Actions, Gradle, npm and Docker ecosystems.

These statements verify wiring, not successful execution or test sufficiency.

## Validation evidence and limits

| Check actually performed | Result |
|---|---|
| `git status --short`, revision and local source inspection | Three unrelated wrapper edits preserved |
| Parse ten workflow files with installed `js-yaml` via Node | All parsed; this is not Actions schema/actionlint validation |
| Execute original detector Bash event/path logic using Git fixtures | Five failing cases: manual, schedule, first push, failed diff, root catalog |
| Detector control cases | Shared source selects 8; Order-only selects 1; docs-only selects 0 |
| Inspect action references and workflow controls using parsed YAML | 0/46 SHA pins; missing timeouts/concurrency as recorded above |
| Jenkins path existence checks | Current paths exist; referenced legacy root paths do not |
| Complete original detector including matrix serialization | Not completed: local Git Bash lacks `jq`; selection-only harness excluded serialization |
| actionlint, Gradle, Testcontainers, Docker stack, frontend/docs suites | Not run; no implementation changes |
| Live GitHub runs, branch rules, environment protection, Jenkins settings | Not inspected; no live readiness claim |

GitHub documents skipped-job behavior and dependency handling in
[workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
and [status checks](https://docs.github.com/en/pull-requests/reference/status-checks).
This is why a stable gate must validate prerequisite results explicitly.

## Recommended implementation sequence and acceptance

1. Fix selection correctness and cover event/path cases with a small fixture test;
   add workflow linting. Do this before cosmetic renames.
2. Add explicit shared-module verification and an aggregate gate; connect security
   enforcement to release eligibility for the same source revision.
3. Establish one release artifact/digest, source-bound deployment configuration,
   trust checks, readiness and rollback. Verify environment/ruleset settings.
4. Repair or formally retire legacy Jenkins paths and clarify its handoff role.
5. Apply naming atomically with trigger/filter/documentation/required-check updates;
   establish the static-analysis baseline, action pins and least-privilege controls.

Owner: Tauqeer drives implementation; Codex provides guidance and review. The
user's current request is a review for enterprise qualities and naming; it does
not authorize external settings changes, publication, deployment or Jenkins runs.
