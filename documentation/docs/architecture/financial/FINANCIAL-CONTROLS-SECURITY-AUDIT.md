---
title: Financial Controls, Security, And Auditability
description: Design maker-checker approval, entitlements, sensitive-data boundaries, tamper-evident audit evidence, retention, and secure financial operations.
difficulty: Advanced
page_type: Guide
status: maintained
prerequisites: [Spring Security, threat modeling, ledger and payment fundamentals]
technologies: [OAuth2, Spring Security, Vault, Kubernetes, PostgreSQL]
last_reviewed: "2026-07-28"
scope: generic
owner: docs-architecture
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Financial Controls, Security, And Auditability

Security answers who may act. Financial control additionally asks whether the action is allowed
for this product, amount, account, business date, jurisdiction, risk state, and approval chain—and
whether independent evidence proves that decision later.

## Trust Boundaries

```text
human or channel identity
  -> authentication and session assurance
  -> entitlement or policy decision
  -> transaction-specific authorization
  -> optional maker-checker approval
  -> guarded business command
  -> ledger or payment effect
  -> independent audit and reconciliation evidence
```

Gateway authentication is not sufficient. The owning service enforces resource, tenant, operation,
amount, state, and approval rules against trusted attributes.

## Authorization Models

Combine deliberately:

- RBAC for job responsibility;
- ABAC for tenant, region, desk, product, amount, risk and time constraints;
- relationship/ownership checks for customer or account access;
- transaction authorization bound to the exact operation details;
- policy versioning and decision evidence.

Do not place every volatile permission in a long-lived JWT. Validate issuer, audience, time and
signature, map claims carefully, and retrieve or version dynamic authorization state where needed.

## Maker-Checker And Segregation Of Duties

```text
DRAFT -> SUBMITTED -> APPROVED -> EXECUTING -> EXECUTED
             |           |
             -> REJECTED -> EXPIRED or CANCELLED
```

- The maker cannot approve their own request.
- The checker is entitled at approval and execution time.
- Approval binds a canonical hash of operation, amount, currency, accounts, reason and expiry.
- Editing the command invalidates prior approval.
- Thresholds determine the number and type of approvers.
- Execution is idempotent and references the approval.
- Emergency access is time-bound, exceptional, alerted, and reviewed.

Two HTTP calls are not maker-checker when both credentials belong to the same person or automation.

## Audit Evidence

Capture actor and delegated identity, authentication/session context, policy decision and version,
object and before/after references, operation identity, reason, approval, source channel, timestamps,
outcome, and correlation IDs.

Audit records should be append-only to normal application paths, tightly access-controlled,
encrypted, retained under approved policy, monitored for delivery gaps, and copied to a separate
control boundary where appropriate. Hash chains or signatures can make tampering detectable but
cannot prove omitted events were recorded. Sequences, totals, and reconciliation address completeness.

Never log passwords, access tokens, secret keys, payment credentials, full sensitive account data,
or unrestricted PII. Tokenization and masking reduce exposure; they do not automatically eliminate
compliance obligations.

## Sensitive-Data And PCI Boundary

Minimize collection and storage. Prefer provider-hosted or tokenized payment methods so services do
not receive raw cardholder data when the product permits it. Build a data-flow diagram covering
entry, processing, storage, logs, queues, backups, analytics, support tools, and deletion.

PCI applicability and scope require qualified security and compliance ownership. Use current PCI
SSC documents rather than copying an old checklist into the architecture.

## Secrets And Cryptographic Keys

- Keep secrets outside source, images, manifests, and logs.
- Authenticate workloads to a secret manager with short-lived identity.
- Separate encryption, signing, and authentication keys.
- Use managed KMS/HSM controls where policy requires them.
- Version keys and support overlap during rotation.
- Define JWKS/certificate cache and outage behavior.
- Audit privileged key use and rehearse compromise rotation.

Deleting a key can destroy data; retaining a compromised key extends exposure. Key lifecycle,
backup, escrow, destruction, and recovery need approved ownership.

## Operator And Support Safety

Provide narrow commands instead of database write access. Show masked data, require a case and
reason, preview effects, enforce limits and approval, use stable idempotency keys, and return
immutable operation references. Manual SQL fixes bypass invariants, outbox, audit, and reconciliation.

## Threat Scenarios

| Threat | Controls and evidence |
|---|---|
| replayed transfer | idempotency, transaction authorization, timestamp policy |
| account or tenant substitution | server-side ownership and audience/resource checks |
| compromised support account | least privilege, step-up, maker-checker, anomaly detection |
| forged callback | signature/mTLS, replay defense, provider-state correlation |
| audit manipulation | restricted append path, independent copy, sequence/totals, alerts |
| stale entitlement | short/versioned authorization, revocation and fail-safe policy |
| secret exfiltration | workload identity, vault/KMS, egress controls, rotation evidence |
| malicious adjustment | immutable original, approved reversal, reconciliation |

## Security Incident Priorities

1. Protect customers and stop unauthorized value movement with reversible, scoped controls.
2. Preserve identity, policy, audit, ledger, provider, and infrastructure evidence.
3. Rotate or revoke compromised credentials without destroying evidence.
4. Identify affected operations from authoritative records, not logs alone.
5. Reconcile external and internal positions and correct through approved entries.
6. Follow legal, privacy, regulatory, and customer-communication procedures.
7. Validate containment, recovery, residual access, and control improvements.

## Official References

- [PCI Security Standards Council document library](https://www.pcisecuritystandards.org/document_library/)
- [OWASP Transaction Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Authorization_Cheat_Sheet.html)
- [OWASP Logging](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [NIST Digital Identity Guidelines](https://pages.nist.gov/800-63-4/)

## Recommended Next

Finish with [Financial Production Scenarios And Interview Workbook](./FINANCIAL-PRODUCTION-INTERVIEW.md).

