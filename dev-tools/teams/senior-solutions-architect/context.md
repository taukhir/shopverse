# Codex — Senior Solutions Architect Context

Append-only durable knowledge; append corrections when evidence changes.

## 2026-10-30 — Onboarding baseline

- Tauqeer appointed Codex Product Manager and requested continuity across sessions plus active/inactive status.
- Team memory conventions: ../README.md. Existing roles and responsibilities: ../TEAM.md.
- Current stated focus is Avro event schemas and OpenAPI DTO contracts used across services. Drafts are in ../tauqeer/task/order-contract-design/; task.md explicitly marks them draft, not implemented.
- Recorded direction: one shopverse-contracts module and one shopverse-avro-schemas module, namespaced and owned per service. Source: ../sprints/sprint-0001/discussion-05.md, item 6; ../BACKLOG.md FEAT-E and FEAT-L.
- Discussion-05 records foundational engineering before November 12 and client requirements afterward. Treat this as historical planning context; do not infer a new deadline or completed work from it.
- BUG-001 multi-item checkout remains a distinct outcome from contract infrastructure. Its implementation scheduling is unresolved in discussion-05 and the draft task.
- Earlier role indexes can lag later discussions; reconcile against primary evidence rather than assuming every index is current.
- Draft review concern: task.md says every Avro field has a default, while order-created-event.avsc contains fields without defaults. Review the actual compatibility requirements before adopting this statement.
- Draft review concern: adding eventId to a schema alone does not implement transactional inbox deduplication, despite task.md describing it as closing that gap. Verify consumer persistence and atomic processing before claiming completion.
- No production source, build wiring, registry configuration, or runtime behavior has been verified during this onboarding. File-based planning evidence is not proof of implementation.

## 2026-10-30 — User preferences and continuity requirement

- User explicitly wants Codex to be a persistent team member as Product Manager, with context and information saved across sessions and visible active/inactive status.
- User reiterated that memory must be discoverable through agent instructions, not depend on remembering this chat. Root ../../AGENTS.md now directs future workspace sessions to this role's index and status.
- Save substantive conversation facts, decisions, preferences, pending questions, task progress, and source references during work and before handoff. Do not promise verbatim recall of every exchange, hidden internal state, or context from conversations not available here.
- Current request authorizes memory and instruction maintenance. It does not assign production implementation, backlog reprioritization, commits, or external communications.
- Working location: D:/BE Projects/shopverse; user-facing timezone: Asia/Calcutta. Preserve unrelated existing changes; the repository already had substantial unrelated modifications at the initial inspection.
- Team knowledge is distributed across role folders and sprint records. Use ../README.md and ../TEAM.md as entry points; read relevant role indexes before deeper history. Do not duplicate all team records into this folder or treat old summaries as authoritative over current evidence.

## 2026-11-04 — Continuity correction and meeting context

- Earlier in this chat, Tauqeer explicitly stopped assistant implementation: "I will do it you guide me." Continue in guidance/review mode unless he explicitly reassigns implementation. This supersedes earlier implementation authorization.
- Before that stop, Codex added a partial shopverse-contracts module with an Order OpenAPI document, generator configuration, Order service dependency, controller adaptations and OrderContractMapper. Specification validation passed; compilation initially failed on Instant imports, a fix was attempted, and the subsequent check was interrupted. Do not claim the changes are verified or infer their current status without checking.
- Latest product discussion: improve Order contract guarantees, money/currency semantics, line items, lifecycle, customer/admin data exposure, idempotency/errors and pagination before wider adoption. These were recommendations, not approved contract changes.
- Tauqeer invited Codex to join the sprint meeting on November 4. Reloaded Sprint 0001 records; do not fabricate attendance or decisions for other roles.

## 2026-11-04 — Role reassignment

Tauqeer explicitly changed Codex's role everywhere to Senior Solutions Architect and requested an independent Cybersecurity Engineer agent to find security lapses. Current role pointers and roster are updated; historical entries retain the original role with this dated correction. The prior guidance-only implementation constraint remains in force. New security role: ../cybersecurity-engineer/index.md. First assignment is a bounded Order API/contracts security review, not a complete platform audit.
