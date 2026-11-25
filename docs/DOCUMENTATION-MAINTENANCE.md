# Documentation Maintenance Rules

This policy defines which ShopVerse documents must change when code, APIs,
configuration, or platform behavior changes. Documentation updates belong in
the same change as the implementation whenever they describe the changed
behavior.

## Required change process

1. Identify the owning service or platform area from repository routing in the
   root `AGENTS.md`.
2. Read relevant source, tests, configuration, and existing documentation.
   Treat source and executable contracts as evidence; do not copy stale claims.
3. Update the canonical document for each changed surface using the matrix
   below. Update links/indexes when adding, moving, renaming, or deleting docs.
4. Check links and the diff for accuracy and unintended changes.
5. In the handoff, list documentation updated and any applicable document not
   updated with a short reason. Do not report unverified behavior as implemented.

## Change-to-document matrix

| Change | Required documentation updates |
|---|---|
| New, removed, or changed endpoint, request/response, validation, status code, auth, or ownership rule | Owning `services/<service>/README.md`; service OpenAPI/contract source; `docs/development/API-GUIDE.md` for platform-wide or cross-service API guidance; gateway routing/security docs and web API usage docs when affected. |
| Feature behavior, business rule, lifecycle, or user workflow | Owning service README; `docs/reference/FEATURES-AND-DEMOS.md`; relevant case study, architecture flow, or operations guide. Update web help/docs when UI flow changes. |
| Kafka event/schema, producer/consumer, ordering, retry, DLT, replay, or outbox behavior | Producer and consumer service docs; event contract/schema references and compatibility notes; relevant architecture/ADR and recovery/operations docs. |
| Database entities, indexes, constraints, migrations, or data ownership | Owning service README/data model or migration guide; architecture state/data boundary docs when boundaries change. |
| Configuration, secrets, environment variables, ports, deployment, CI, or local development | Owning service README and canonical configuration/deployment/runbook docs; root docs when shared setup or platform behavior changes. Never put secret values in docs. |
| Security/authentication/authorization change | Owning service security/API docs; relevant ADR and security flow/reference; audit/plan in `dev-tools/teams/docs/` when a tracked finding or recommendation changes. |
| Observability, alerting, dashboards, recovery, or operational procedure | `docs/observability/SHOPVERSE-OBSERVABILITY-OPERATIONS.md` or applicable service runbook/README; recovery case study where relevant. |
| Architecture decision or cross-service boundary change | Add/update an ADR and affected architecture documents; update `docs/README.md` and feature matrix if applicable. |
| Audit, assessment, or implementation plan | Save under `dev-tools/teams/docs/`, link from its `index.md`, and update the responsible team's index/status or handoff when ongoing work or a decision is affected. Separate evidence, inference, and unresolved runtime questions. |
| Internal refactor with no externally observable or operational impact | Update service README only if its documented structure is misleading; otherwise no doc update, with reason in handoff. |

## Canonical document locations

- Root platform documentation: `docs/README.md` is the navigation index for
  architecture, ADRs, API guidance, feature status, case studies, and operations.
- Service-specific API and operational detail: `services/<service>/README.md`
  and service-local contracts/runbooks. Root docs summarize cross-service
  behavior and link to the owner.
- Contributor audits and plans: `dev-tools/teams/docs/index.md` indexes reports
  under `dev-tools/teams/docs/`.
- Agent routing: `dev-tools/teams/AGENT-DOCS-INDEX.md` maps task types to
  canonical docs, evidence sources, and team handoffs. Team indexes own their
  status and decisions.
- Published knowledge base: `shopverse-docs` is separate. This repository's
  docs remain canonical for code behavior. If a code change affects published
  content, record a separate follow-up; do not imply it was updated unless
  verified.

## Quality bar

- Prefer one canonical explanation and links over copied versions.
- Include routes, symbols, configuration keys, event names, and examples only
  when verified against the current repository.
- Mark planned work, partial implementation, and unverified runtime behavior.
- Keep indexes searchable; add a descriptive title and one-line purpose for
  each new document.
- Never include credentials, access tokens, personal data, or production
  customer information.
