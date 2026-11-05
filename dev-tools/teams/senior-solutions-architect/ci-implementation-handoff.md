# CI implementation handoff

Date: 2026-11-05, Asia/Calcutta. User explicitly assigned local implementation
after the CI review and impact analysis. Earlier guidance-only restrictions
remain for unrelated application/contract work. No commit, push, PR, remote
settings change, Jenkins request, registry publication or deployment was made.

## Outcome and readiness

Implemented the local CI/CD configuration and naming changes. Local pipeline
tests, workflow validation, Compose model validation and documentation checks
pass. Rollout is **not ready to claim green**: strict checks expose existing
handwritten-code findings, Docker execution is unavailable and hosted controls
still require setup. These gaps were not hidden with a baseline suppression.

## Implementation

- Nine named workflows replace the previous ten. See the canonical inventory
  and setup/recovery procedure in `.github/workflows/README.md`.
- Backend uses tested conservative change detection, shared-module checks,
  handwritten-code Checkstyle/SpotBugs enforcement, Java 25, bounded matrices,
  real Testcontainers jobs, and an always-evaluated `Backend CI Gate`.
- Master pushes deliberately select every service, producing a complete
  release candidate set. PRs remain selective. Nightly/manual/merge-group
  runs verify all services. Invalid history cannot silently select nothing.
- Security is called by backend rather than racing it independently. Secret,
  lockfile/configuration and image scans are blocking. CodeQL covers Java,
  JavaScript/TypeScript and Actions when account capability permits it.
  CodeQL alert-based merge blocking still needs GitHub ruleset configuration.
- CI scans the built images, exports source/run/image identity, checksums and
  SBOMs; the SAGA test loads the same image archives with `--no-build`.
- Production release validates a successful same-repository master-push CI run,
  verifies/loads its candidate archives, publishes without rebuilding and
  assembles eight per-service registry digests. It does not deploy `latest`.
- Optional SSH deploy binds configuration to source SHA, requires a host
  fingerprint and explicit existing Compose project name, and waits for health.
  It stays behind `ENABLE_SSH_DEPLOY` and the production environment.
- Full action SHA pins, job-level token permissions, bounded jobs, disabled
  persisted checkout credentials and `.github/CODEOWNERS` protect the pipeline
  once the required repository policies are enabled.
- Web no longer repeats documentation verification. Dependabot replaces the
  overlapping monthly docs update workflow. Jenkins is manual only; current
  source/layout/root-build-context paths and explicit source identity are fixed.
- README badges, self-path filters and operational/testing documentation point
  at the new names. Existing image repositories/service names/cache scopes remain.

Implementation files: `.github/workflows/*.yml`, `.github/workflows/README.md`,
`.github/ci/pipeline.mjs`, `.github/ci/pipeline.test.mjs`,
`.github/ci/enforce-quality.gradle`, `.github/ci/lint-workflows.mjs`,
`.github/CODEOWNERS`, the shared and three service Jenkinsfiles, root README,
testing guide and the five linked documentation pages. Team continuity files
record this handoff. Existing nine wrapper edits and Order-analysis artifacts
were preserved; no application Java, API, schema or migration changes were made.

## Complexity and pipeline coverage

Four core product responsibilities are enough: backend/security, Web, Docs,
and release/deployment. Reusable security is a dependency of backend, not an
extra autonomous release coordinator. Visual/docs labs and Jenkins are support
workflows; do not require them as blanket backend release prerequisites.

There is no per-service workflow duplication, GitHub-to-Jenkins automatic
chain, second container rebuild for security/release, or duplicate monthly
dependency updater. Complete post-merge images and short-lived archives cost
compute/storage; measure these before adopting more complex partial releases.

Core checks now include workflow/config linting, Java unit/static/shared checks,
commerce infrastructure integration, same-image SAGA smoke, Web E2E/a11y/performance,
dependency/secret/configuration/container/source analysis, SBOMs and digest promotion.
Signing/provenance attestation, measured load/resilience/SLO gates and backward
contract compatibility are follow-ups when policy and accepted contract baselines
exist. Current OpenAPI syntax/generation validation is not a compatibility guarantee;
current Avro generation does not prove runtime adoption or registry compatibility.

## Verification actually executed

| Command/check | Outcome |
|---|---|
| `node --test --test-reporter=dot .github/ci/*.test.mjs` | 25 pass, including selection events/inputs, failed/cancelled/missing gate checks, release trust/source validation, complete per-service manifests and CLI/SBOM companion handling |
| `node .github/ci/lint-workflows.mjs` | Pass; checksum-verified Actionlint 1.7.10 validates workflow schema/expressions |
| YAML graph/action/shell audit via Node and Git Bash `-n` | Nine workflows; 29 local needs edges valid; all external action refs pinned (57 after Java extraction setup); 40 Bash/SSH bodies parsed |
| `docker compose ... config --quiet` for CI base/test and base/digest-release override | Both pass; no daemon required, no containers started |
| `npm run check:fast` from documentation | Pass, all 961 pages validated plus TypeScript configuration |
| `npm run check:language` from documentation | Pass, 961 pages |
| `npm run build` from documentation | Pass; generated `/operations/GITHUB-ACTIONS/` route exists and contains renamed workflow links |
| Common `gradlew.bat check --continue --no-daemon --no-configuration-cache --max-workers=2 -I ../.github/ci/enforce-quality.gradle` | Fails seven existing-source quality tasks; no test failures reported |
| Order `gradlew.bat check --continue --no-daemon --no-configuration-cache --max-workers=2 -I ../../.github/ci/enforce-quality.gradle` | Fails Checkstyle main and SpotBugs main; no test failures reported |
| `docker info` | Engine unavailable (`dockerDesktopLinuxEngine` pipe absent) |

Initial Java checks also exposed generated-source lint noise, Avro configuration
cache incompatibility and old SpotBugs unsupported Java 25 bytecode. CI now excludes
generated-only Java from static analysis, disables configuration caching and pins
the CI analysis engine to SpotBugs 4.9.8. Subsequent checks reach actual source
findings rather than analyzer bytecode failures. Runtime/application dependencies
and local default quality policy were not upgraded or changed.

Remaining source findings observed in generated reports:

- Common: 15 SpotBugs findings across error, Kafka, recovery, observability,
  outbox and pagination modules (`EI_EXPOSE_REP` / `EI_EXPOSE_REP2`); one
  Checkstyle unused `java.util.List` import in `ShopverseJwtAuthoritiesConverter`.
- Order: four SpotBugs mutable-representation findings and ten Checkstyle
  findings (eight star imports and two `EqualsAvoidNull` findings).

These are analysis reports, not confirmed exploitable security vulnerabilities.
No broad application cleanup or blanket suppression was included. Triage should
distinguish intentional injected dependencies/generated Lombok accessors from
unsafe public mutable state before changing behavior or accepting an exception.
Existing tests in the continued checks completed or were up-to-date; this does
not establish all eight services are green under the new policy.

## Required rollout work

1. Review/fix or narrowly justify the source quality baseline before expecting
   `Backend CI Gate` to succeed. Investigate any scanner findings in the first
   hosted run; no vulnerabilities were silently waived in this task.
2. Coordinate required-check name migration, owner review, protected master,
   production reviewers/branch rules, CodeQL entitlement and alert-based merge
   protection. YAML/CODEOWNERS alone do not enforce repository settings.
3. Rehearse all eight images, Testcontainers, same-image SAGA, artifact download,
   GHCR publication, source-bound bind mounts, host health and recovery on a
   disposable environment. Docker was unavailable locally; none of these live
   paths were executed. Jenkins Declarative Pipeline syntax was not validated
   against a running Jenkins controller.
4. Confirm the host's existing Compose project/volumes and keep deployment off
   until the rehearsal passes. Candidate archives expire after seven days;
   older rollback requires a retained manifest/digests and operator approval.
   Application rollback does not reverse Liquibase migrations.

The operations guide contains concrete variable/secret names, retention and
recovery boundaries. No request to approve or perform live operations is made
by this handoff.
