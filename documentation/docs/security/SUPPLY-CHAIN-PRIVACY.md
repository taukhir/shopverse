---
title: Supply-Chain Security And Privacy Engineering
difficulty: Advanced
page_type: Reference
status: Generic
keywords: [SBOM, SLSA, artifact signing, provenance, admission policy, data classification, consent, anonymization, legal hold]
learning_objectives: [Secure software from source to deployment, Design enforceable privacy controls, Verify deletion and retention across derived data]
technologies: [GitHub Actions, Docker, Kubernetes]
last_reviewed: "2026-07-12"
---

# Supply-Chain Security And Privacy Engineering

## Software Supply Chain

Threats include compromised dependencies, build runners, credentials, registries,
base images, update channels, and deployment configuration. Pin and review
dependencies, minimize build permissions/network, isolate untrusted builds, keep
artifacts immutable, and promote the same tested artifact between environments.

An SBOM inventories components and versions; vulnerability scanning maps known
issues but requires exploitability/context and remediation SLAs. Scan source,
lockfiles, images, IaC, secrets, and running assets. Handle false positives and
unfixed vulnerabilities through documented risk decisions—not silent suppression.

Sign artifacts and attach verifiable provenance describing source, build identity,
inputs, and process. SLSA provides maturity concepts for preventing tampering.
Deployment admission can require trusted signatures/provenance, approved
registries, non-root images, resource limits, and policy compliance.

Secure release flow:

```text
reviewed source -> isolated reproducible build -> tests/scans -> SBOM
-> signed artifact + provenance -> immutable registry -> admission policy -> runtime
```

Protect signing keys with short-lived workload identity or managed key systems,
separate duties for high-risk releases, audit overrides, and rehearse revocation
and rebuild after compromise.

## Privacy Engineering

Classify data as public, internal, confidential, PII, sensitive PII, financial,
authentication, health, or other regulated classes appropriate to the business.
For each field record purpose, legal basis/consent, owner, allowed uses, regions,
retention, access, sharing, encryption, deletion, and audit requirements.

Apply data minimization and purpose limitation at collection and in events, logs,
analytics, test fixtures, AI prompts, support tools, and exports. Tokenization
replaces sensitive values with controlled references; pseudonymization reduces
direct identity but may remain personal data; anonymization must resist realistic
re-identification and is difficult to guarantee.

## Rights, Retention, And Legal Holds

Build discover/export/correct/delete workflows around a stable subject index and
authenticated request. Deletion must cover authoritative databases, replicas,
caches, search/vector indexes, object storage, analytics, events/projections, and
vendors. Backups may follow delayed expiry; document isolation and non-restoration
or re-deletion behavior.

Legal hold overrides normal deletion only through authorized, scoped, audited
process. Retention jobs need dry run, bounded batches, metrics, reconciliation,
and evidence. Avoid exposing subject existence through authorization errors.

## Recommended Next Page

Read [PII-Safe Logging](../observability/PII-SAFE-LOGGING.md), then
[JVM Profiling, Garbage Collection, And Native Images](../java/JVM-PROFILING-GC-NATIVE.md).

## Official References

- [SLSA specification](https://slsa.dev/spec/)
- [CycloneDX specification](https://cyclonedx.org/specification/overview/)
- [NIST Privacy Framework](https://www.nist.gov/privacy-framework)
