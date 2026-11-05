# Java quality and source-security policy

Checkstyle, SpotBugs and HIGH/CRITICAL source/configuration scans remain blocking.
No warning threshold was relaxed, scanner disabled or vulnerability ignored.

## Java findings

Wildcard/unused imports and nullable string comparisons were fixed in the reported
services. Collection-bearing API/error/pagination/readiness/authentication records
now copy their input collection and expose an unmodifiable container. Null inputs,
null elements/values and iteration order retain their existing behavior so that
validation/serialization remains compatible. This is a shallow container snapshot;
arbitrary nested metadata objects are not claimed to be deeply immutable.

Regression tests cover caller mutation, accessor mutation, authorization role and
permission sets, readiness settings and existing null semantics. Production
call-site searches found no mutations through the changed record accessors.

`spotbugs-exclude.xml` contains reviewed representation-exposure false positives:

- Constructor-injected Spring services, configured ObjectMappers, metrics
  registries, Kafka clients, transaction infrastructure and bound settings are
  intentionally shared. Cloning them breaks application-wide identity/configuration.
  Each exclusion names the exact class, constructor and field, and only
  `EI_EXPOSE_REP2`.
- The getter-only `ShopverseObservabilityProperties.requestLogging` bean is
  populated in place by Spring configuration binding. Returning a copy discards
  binding updates; only that getter/field's `EI_EXPOSE_REP` finding is excluded.
- User Service's enumerated Hibernate associations require live entity identity
  and mutable relationship tracking. Exact getter/setter/constructor/Lombok-builder
  association fields are excluded for `EI_EXPOSE_REP`/`EI_EXPOSE_REP2`. Controllers,
  including the internal authenticated-user endpoint, return mapped DTOs. DTO
  collections remain checked and were corrected rather than excluded.

These are framework ownership decisions, not waivers for customer-controlled
mutable DTOs. Policy tests require exact classes, bounded member patterns and
specific bug types; they forbid DTO/auth-model and blanket package exclusions.
New findings require a source/caller review, not expansion of these matches.

## Dependency and Dockerfile findings

The hosted source SARIF contained 14 HIGH/CRITICAL findings in six documentation
dependencies and two root-user Dockerfile findings. Targeted npm overrides resolve:

| Dependency | Remediated version |
|---|---|
| body-parser | 1.20.9 |
| image-size | 2.0.3 |
| proxy-addr | 2.0.8 |
| tinypool, scoped to Docusaurus core | 2.1.2 |
| undici | 7.30.1 |
| webpack-dev-middleware | 7.4.6 |

Tinypool crosses a major version because the vulnerable 1.x line has no patched
version identified by the advisory. The override is limited to its Docusaurus
consumer. The production documentation build and a focused worker-context/pool
execution compatibility check passed with the updated dependency.
Revisit overrides when upstream dependency ranges include patched releases.
Primary advisory references: [body-parser maintainer notice](https://expressjs.com/en/blog/2026-10-28-cve-2026-111181/)
and [Tinypool advisory](https://github.com/advisories/GHSA-85c8-ppgw-ccpr).

Web and Docs containers now run nginx as its non-root user, with writable cache
and temporary PID paths and an internal listener/healthcheck on 8080. Both full-stack
Compose overlays map the existing host ports to that listener. Static routes,
API/auth proxy paths and external URLs remain unchanged.

## Validation and limits

During this remediation, strict `check` tasks passed for shared modules and the
affected services with the CI init script, Java 25 analysis and configuration
caching disabled. New collection regression tests passed with those checks.
Pipeline policy tests and Actionlint validate the exception/CI wiring.

A checksum-verified portable Trivy 0.76.1 scan of the working source/configuration
tree reported zero HIGH/CRITICAL SARIF results. Ignored local worktrees, installed
dependencies and generated build output were excluded, as they are absent from
a clean hosted source checkout. The production documentation build also passed.
`npm audit --audit-level=high` remains a separate corroborating check; lower-severity
advisories are not described as fixed by this HIGH/CRITICAL remediation.

Docker became available for the subsequent runtime verification: all ten image
builds and twelve Testcontainers integration tests passed. The full checkout SAGA
failed, and GitHub branch/CodeQL/production approval protection is absent. See
[runtime verification](runtime-verification.md) for evidence and remaining blockers.
Local checks do not establish post-deployment readiness or the outcome of the next
hosted PR run. Team-memory files are excluded from this change.
