---
title: Service README And AI Capability Gap Matrix
description: Coverage and gap analysis for Shopverse service READMEs, AI-assisted workflows, scoped instructions, evaluations, and documentation-site accessibility.
sidebar_label: README And AI Gap Matrix
difficulty: Intermediate
page_type: Reference
status: maintained
technologies: [Shopverse, Codex, Claude Code, AI Evals, Docusaurus]
last_reviewed: "2026-07-29"
scope: shopverse
owner: docs-services
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Service README And AI Capability Gap Matrix

This page separates three concerns that are easy to confuse:

1. **runtime capability** — behavior implemented by a Shopverse application;
2. **AI-assisted engineering capability** — prompts, instructions, evidence, and
   evaluations used by developers;
3. **documentation coverage** — whether the canonical README is searchable and
   navigable on the Docusaurus site.

The current AI additions improve software delivery. They do not add a chatbot,
recommendation engine, model API, or autonomous production operator to the
Shopverse runtime.

## Coverage Matrix

| Component | README AI section | Site mirror | Scoped instructions | Deterministic evaluation | Highest-value remaining gap |
|---|---|---|---|---|---|
| API Gateway | complete | complete | nested `AGENTS.md` and `CLAUDE.md` | route/JWT/readiness | execute gateway integration fixture |
| Auth Service | complete | complete | nested `AGENTS.md` and `CLAUDE.md` | identity/JWKS/secrets | execute overlapping key-rotation fixture |
| User Service | complete | complete | nested `AGENTS.md` and `CLAUDE.md` | identity/method-security/secrets | execute full filter-chain and cache fixture |
| Order Service | complete | complete | nested `AGENTS.md` and `CLAUDE.md` | architecture, ownership, validation | cancellation, fulfillment, return, and late-event scenarios |
| Inventory Service | complete | complete | nested `AGENTS.md` and `CLAUDE.md` | duplicate consumer plus concurrency/expiry | execute multi-replica database fixture |
| Payment Service | complete | complete | nested `AGENTS.md` and `CLAUDE.md` | duplicate consumer plus timeout/double-capture | execute provider sandbox contract fixture |
| Config Server | complete | complete | nested `AGENTS.md` and `CLAUDE.md` | precedence/refresh/diagnostics | add typed property schemas |
| Cloud Configs | complete | complete | nested `AGENTS.md` and `CLAUDE.md` | route/secret/rollback plus executable validator | add typed property schemas |
| Discovery Server | complete | complete | nested `AGENTS.md` and `CLAUDE.md` | churn/staleness/readiness | execute multi-node failure fixture |
| Shopverse Platform | complete | complete | nested `AGENTS.md` and `CLAUDE.md` | adopter compatibility/migration | execute cross-adopter build matrix |
| Shopverse Web | complete | complete | nested `AGENTS.md` and `CLAUDE.md` | accessibility/state/Web Vitals | retain browser evidence as acceptance gate |

## Closed Gaps

- Every canonical component README now explains useful AI workflows, boundaries,
  validation expectations, and service-specific risk.
- Root `AGENTS.md` and `CLAUDE.md` provide durable shared instructions.
- Every component has nested scoped guidance where module-specific invariants apply.
- The tool-neutral `ai-workflows/` library supplies implementation, debugging,
  Kafka, performance, security, UX, documentation, and incident workflows.
- Fourteen deterministic scenarios score architecture, reliability, authorization,
  configuration, discovery, gateway, payments, inventory, frontend, platform,
  bounded implementation, documentation, and performance results.
- All component READMEs are generated into searchable site-native pages from one
  canonical source.

## Remaining Production Evidence

Documentation CI now watches canonical READMEs, scoped instructions, and AI workflow
assets. It enforces README mirrors, cloud configuration safety, documentation quality,
and the AI suite. The pull-request template records AI use, human decisions, rubric
changes, evidence, and unexecuted checks.

The remaining work is runtime evidence rather than missing guidance: multi-replica
inventory/discovery tests, provider-sandbox payment tests, overlapping JWKS rotation,
cross-adopter starter builds, and browser accessibility/performance execution. Keep
these distinct from deterministic reasoning evaluations.

### Priority 2: Add Runtime AI Only With A Product Requirement

If Shopverse later adds product recommendations, support assistance, semantic
search, or operational copilots, create separate threat models, data policies,
evaluation sets, latency/cost budgets, fallback behavior, and observability. Do
not infer runtime AI readiness from the developer workflow assets.

## Governance Checks

- Canonical READMEs remain beside their components.
- Generated mirrors carry a source warning and are not edited manually.
- README links inside `documentation/docs/` become site-relative links; other
  repository links point to their canonical GitHub source.
- Secrets and real customer/payment data remain outside prompts and fixtures.
- AI claims require source, test, query, trace, metric, or browser evidence.
- External writes, production mutations, replay, deployment, and destructive
  actions retain explicit human approval.

## Next Pages

- [Service README Index](./SERVICE-README-INDEX.md)
- [Shopverse Service Catalog](./SERVICE-CATALOG.md)
- [AI Context Engineering](../ai/AI-CONTEXT-ENGINEERING-GUIDE.md)
- [AI Evaluation, Cost, And Productivity Metrics](../ai/AI-EVALUATION-COST-PRODUCTIVITY-METRICS.md)
- [Shopverse AI Practical Workbook](../ai/SHOPVERSE-AI-PRACTICAL-WORKBOOK.md)
