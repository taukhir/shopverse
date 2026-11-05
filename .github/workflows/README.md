# ShopVerse CI/CD operations

GitHub Actions is the canonical verification and release path. Jenkins is a
manual demonstration, not a second automatic production pipeline.

## Pipeline inventory

| File | Purpose | Trigger and status |
|---|---|---|
| `ci-backend.yml` | Config and workflow validation, affected-service quality/unit checks, shared-module tests, Testcontainers, image builds/scans, SAGA and stable gate | PRs; complete runs on master pushes, merge queue, nightly and manual |
| `ci-security.yml` | Secrets, dependencies/configuration and CodeQL source analysis | Called once by backend; manual diagnostic run available |
| `ci-web.yml` | Web production build, unit tests, quick E2E, accessibility and Lighthouse | Relevant web PRs/master pushes; manual |
| `docs-verify-publish.yml` | Docs content/build/browser/performance verification and Pages publication | Relevant PRs/master pushes, weekly and manual; publication excluded from PRs |
| `cd-production.yml` | Publish verified candidate images, retain digest manifest, optional protected SSH deployment | Successful master-push backend runs; manual retry with a verified CI run ID |
| `ci-docs-visual.yml` | Linux screenshot comparisons and manual baseline artifacts | Relevant UI changes, weekly and manual |
| `ci-java-labs.yml` | Java documentation labs on JDK 24/25 | Relevant PRs/master pushes; manual |
| `ci-database-lab.yml` | Disposable database-operations exercises | Weekly/manual; optional analytics |
| `integration-jenkins.yml` | Submit a demonstration build with an explicit source SHA | Manual only; optional |

Dependabot already updates Actions, Gradle, npm and Docker dependencies. The
separate monthly `npm update` workflow was removed to avoid overlapping update
PRs. Web CI runs `-Target Web`; Docs owns its own verification, avoiding duplicate
Docusaurus builds in the Windows web job.

Push/PR triggers for Web verification match only `shopverse-web/**`; Docs
verification matches only `documentation/**`. Docs visual and Java lab workflows
retain their narrower paths inside `documentation/`. Changes to workflow files,
root READMEs, service code, shared Gradle files or infrastructure scripts alone
do not trigger these site workflows. Existing manual runs and weekly Docs/visual
checks remain separate from push/PR routing.

Path selection uses the complete PR diff: once a PR includes site changes,
subsequent pushes still verify that site. When canonical README or AI workflow
inputs outside `documentation/` change, regenerate and include their affected
documentation mirrors in the same PR so Docs verification runs. Workflow-only
changes can be checked with Actionlint and a manual site verification run.

## What is required, and what is optional?

The four product responsibilities are backend verification (including security),
web verification, documentation verification/publication, and release/deployment.
The extra visual/lab workflows protect executable documentation; they are not
production release gates. Security is reusable because backend must wait for its
result, not because ShopVerse needs an independent orchestration platform.

Do not add a pipeline for every service: a bounded service matrix provides
isolation without eight copies of the same YAML. Do not run Jenkins automatically
after GitHub CI. Do not add Kubernetes/GitOps, multiple environment promotion
layers or a custom workflow engine until an actual deployment requirement exists.

## Backend verification and selection

PRs select changed services; root `gradle/`, shared code, build-logic, infrastructure,
backend/security/release workflows, runtime CI helpers and Docker context changes
select all services. The known Web, Docs, lab and optional Jenkins workflow files,
CI review Markdown, CI tests and the Actionlint wrapper do not select backend
service jobs by themselves; configuration validation and security checks still run.
Unknown workflow/helper files and unavailable diff history conservatively select
everything. Push diffs use endpoint comparison; PR diffs use the merge base.
Manual, nightly and merge-queue runs are complete. Routing regression tests cover
every service, shared inputs, independent workflows and mixed-service PRs.

Master pushes deliberately verify all eight services to produce a complete
release manifest. This trades additional post-merge compute for a simple,
coherent release. Measure runner minutes before introducing partial releases or
unchanged-image promotion. Full runs have eight unit/quality, three integration
and eight image jobs; matrix parallelism remains bounded.

The CI JDK is 25, matching current build toolchains. Java documentation labs retain
their intentional JDK 24/25 matrix. CI disables Gradle configuration caching because
the existing Avro generator tasks are incompatible; dependency/build caching remains.

Unit/static-analysis jobs have a 20-minute overall limit and a 15-minute Gradle
step limit, leaving time to attempt report upload after a step timeout. Reports
are requested on failure or cancellation, although a hard job/workflow cancellation
can still prevent uploads. This replaces the 10-minute limit exceeded by
[Inventory in run 42098993333](https://github.com/taukhir/shopverse/actions/runs/42098993333/job/127496626041).
Cancelled required jobs still fail `Backend CI Gate`; rerun the upstream checks
after correcting their cause, rather than rerunning only the gate.

The CI init script enforces existing Checkstyle/SpotBugs rules on handwritten Java.
Generated-only OpenAPI/Avro modules are compiled/tested but excluded from static
style/bug analysis; generated Checkstyle sources under `build/` are excluded too.
SpotBugs 4.9.8 is explicitly selected because the plugin's older default cannot read
Java 25 bytecode. Existing handwritten findings remain blocking; there is no silent
baseline suppression or arbitrary coverage percentage.

Reviewed framework false positives are scoped to exact classes, members and bug
types in `../ci/spotbugs-exclude.xml`; DTO collection findings are fixed in source.
See [quality policy and remediation evidence](../ci/quality-policy.md) for rationale
and validation. Tests reject blanket class/package or DTO-model suppressions.

`Backend CI Gate` always evaluates prerequisites. It rejects failure, cancellation,
missing outputs and unexpected skips, and accepts no-change skips only when selection
proves the job was unnecessary. Configure this stable check in branch rules rather
than listing changing matrix job names. Never require path-filtered Web/Docs checks
globally without path-aware rules, or unrelated PRs may remain pending.

## Security policy

Gitleaks scans history with comments and sensitive artifact upload disabled.
Trivy source/dependency/configuration and container scans block HIGH/CRITICAL findings,
including unfixed vulnerabilities. SARIF evidence is retained even when scanning
fails. Container scanning happens on the exact CI image, not a separate rebuild.

CodeQL analyzes Java, JavaScript/TypeScript and Actions source with `security-extended`.
It runs for public repositories; private repositories require Code Security entitlement
and `ENABLE_CODEQL=true`. CodeQL job success proves analysis completed, not that no
alerts exist: configure GitHub code-scanning merge protection for the agreed severity.
Do not enable default setup alongside this advanced setup. Non-Java/Kotlin language
coverage and generated-source limitations must be reviewed when languages change.

No blanket vulnerability allowlist is added. Any future exception needs an owner,
rationale, exact finding and expiry; it must not disable the scanner. Package/source
vulnerability and static-analysis baselines need triage before expecting a green gate.

Actions are pinned to upstream full commit SHAs with version comments; Dependabot
maintains them. Token permissions are job-scoped, checkouts do not persist credentials,
and production publication has package write permission only in its publishing job.

## Build once and promote by digest

1. CI builds each selected image, scans it and, on full runs, exports the image,
   checksum, source/run/image identity and CycloneDX SBOM. The SAGA job loads those
   same archives and uses Compose `--no-build`.
2. Release validates a successful same-repository `master` **push** run through
   `ci-backend.yml`. PR, fork, manual-CI, failed and unrelated workflow runs are rejected.
   Manual release accepts a CI run ID, not an arbitrary image tag.
3. Release verifies archive and image identity, then publishes the loaded images
   without rebuilding. There is no `latest` deployment tag.
4. Release assembles all eight repository/digest records into `release-manifest.json`
   and `compose.release.json`. Mixed-source/run, duplicate and missing images fail.
5. Optional SSH deployment archives configuration from that source revision and
   applies the digest override with `--no-build --wait`. It does not `git pull`
   an unrelated checkout or create production checkout transactions as a probe.

Candidate archives are retained seven days for master pushes and one day for other
full runs; scan/test evidence is retained 14 days and release manifests/SBOMs 90 days,
subject to repository retention/storage limits. Expired candidates cannot be retried
through the CI-run promotion path. For older rollback, use a retained verified release
manifest and existing registry digests through the reviewed operator procedure.
SBOMs/checksums/source identity are provided; cryptographic signing and provenance
attestation are not implemented and must not be inferred from these checks.

## GitHub and host setup required before rollout

These settings are outside local source control and were not changed:

- Confirm `master` is the protected/default release branch. Require PR review,
  owner review for `.github/CODEOWNERS`, and `Backend CI Gate`. Coordinate old
  required-check names before removing them; do not leave the repository blocked.
- Enable the agreed code-scanning merge protection and verify public/private CodeQL
  availability. Organization Gitleaks usage may require `GITLEAKS_LICENSE`.
- Protect `production` with appropriate reviewers and a master-only deployment rule.
  Keep `ENABLE_SSH_DEPLOY` unset/false until a disposable-host rehearsal succeeds.
- Configure environment secrets `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`,
  `DEPLOY_HOST_FINGERPRINT`, `DEPLOY_PATH`, optional `DEPLOY_PORT`, and a read-only
  `GHCR_READ_TOKEN` when the host needs registry authentication.
- Set `DEPLOY_COMPOSE_PROJECT` to the host's **existing** Compose project name;
  it is required to avoid silently switching named volumes. The host needs Docker
  Compose with `--wait`, Git/tar/base64, a clean release directory and an absolute
  repository path with its existing `.env` and persistent data.
- Rehearse source-bound bind mounts, service health, image retention and rollback.
  A prior image/configuration rollback does not reverse Liquibase migrations.
- Verify package visibility/access, action policies, artifact storage and concurrency
  limits. GitHub concurrency serialization is not a FIFO deployment queue.

SSH deployment retains source revisions under `DEPLOY_PATH/releases/<sha>`. Before
operator rollback, validate the previous manifest's registry digests and source SHA,
archive that configuration revision, apply its digest override to the same project,
and wait for service health. Obtain deployment approval; do not run `down -v` or
attempt database rollback as image recovery. Automatic rollback is intentionally
not attempted across potentially incompatible schema migrations.

## Naming and maintenance

Use `ShopVerse / Area / Purpose` display names, kebab-case workflow files/job IDs,
stable aggregate checks and existing kebab-case service names. Display names are
integration identifiers: `cd-production.yml` subscribes to `ShopVerse / CI / Backend`.
Update consumers, self-path filters, badge URLs, runbooks and remote rules together.
Do not rename image repositories, Compose services or service cache scopes as a
cosmetic workflow cleanup.

The optional Jenkins handoff sends `SOURCE_SHA` separately from `IMAGE_TAG`. Jenkins
must load the shared pipeline, check out that exact revision and use root Docker
context with `services/<service>/Dockerfile`. Per-service Jenkinsfiles remain local
demonstrations. Jenkins is not a substitute for the canonical GitHub release gate.
The shared demo uses a build-specific Compose project for disposable volumes;
fixed service container names/ports still require an isolated host. The Jenkins
controller image launches on JDK 21; Gradle provisions the Java 25 build toolchain.

## Local validation

```powershell
node --test .github/ci/*.test.mjs
node .github/ci/lint-workflows.mjs
git diff --check
```

Actionlint is a checksum-verified fixed upstream binary; no npm package is installed.
Its guarded download/write is covered by regression tests and the exact
[CodeQL alert 193 review](../ci/codeql-actionlint-review.md).
It validates workflow schema and expressions; optional ShellCheck/pyflakes are not
invoked by this wrapper. Backend CI also validates the Compose model. Run Java
checks using the CI init script and `--no-configuration-cache`, and run the existing
Testcontainers and SAGA checks with Docker available before claiming runtime readiness.

Implementation references: [GitHub workflow-run trust boundaries](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_run),
[reusable workflows](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows),
[action security](https://docs.github.com/en/actions/reference/security/secure-use),
[CodeQL availability](https://docs.github.com/en/code-security/reference/code-scanning/troubleshoot-analysis-errors/private-repository-enablement),
and [SpotBugs Java 25 support](https://github.com/spotbugs/spotbugs/issues/3564).
