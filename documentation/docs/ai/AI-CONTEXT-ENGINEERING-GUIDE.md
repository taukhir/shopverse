---
title: AI Context Engineering For Software Repositories
description: Design durable repository guidance, task context, routing instructions, and evidence packs for reliable Codex and Claude development workflows.
sidebar_label: Context Engineering
difficulty: Intermediate
page_type: Reference
status: maintained
prerequisites: [AI developer toolkit, Repository architecture fundamentals]
technologies: [Codex, Claude Code, AGENTS.md, CLAUDE.md, Git]
last_reviewed: "2026-07-29"
scope: generic
owner: docs-ai
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# AI Context Engineering For Software Repositories

Context engineering is the deliberate selection, structure, and maintenance of
information an AI assistant needs to perform a task. It is broader than prompt
wording. Good context tells the assistant where truth lives, which constraints
persist, what it may change, and how success is proven.

Official Codex guidance describes `AGENTS.md` as persistent project guidance and
recommends keeping it small, codifying repeated feedback, and placing specialized
instructions near the directory where they apply. See [Codex customization](https://developers.openai.com/codex/concepts/customization)
and [AGENTS.md guidance](https://developers.openai.com/codex/guides/agents-md).

## Choose The Smallest Context Surface

| Information | Best location | Lifetime |
|---|---|---|
| outcome and acceptance criteria | current task prompt | one task |
| repo-wide commands and invariants | root `AGENTS.md` or `CLAUDE.md` | durable |
| module-specific conventions | nearest nested instruction file | durable and scoped |
| repeatable procedure | skill, command, or checked-in script | reusable |
| external current issue, alert, or design | connector/MCP retrieval | live |
| enforced rule | compiler, test, linter, policy, or hook | deterministic |
| architecture explanation | maintained documentation or ADR | durable knowledge |

Do not copy an entire handbook into an instruction file. Point to authoritative
documents and give routing rules for when to read them.

## A Lean Repository Instruction Template

```markdown
# Repository guidance

## Architecture
- Services own their databases; do not create cross-service database access.
- Checkout uses Kafka choreography, transactional outbox, inbox deduplication,
  and compensation. Read the linked ADR before changing event flow.

## Scope and safety
- Preserve unrelated working-tree changes.
- Ask before destructive actions, external writes, or contract expansion.
- Never log credentials, payment data, tokens, or customer-sensitive fields.

## Commands
- Run the narrowest module test first.
- Run the documented repository validation before handoff.

## Review expectations
- Check authorization, idempotency, transaction boundaries, event compatibility,
  migrations, observability, and negative tests.

## Routing
- Order and checkout: `order-service/` plus checkout architecture docs.
- Stock and reservations: `inventory-service/`.
- Payment lifecycle: `payment-service/`.
- UI behavior: `shopverse-web/`.
```

Only include verified commands. A stale command is worse than a link to the
current build documentation.

## ShopVerse Context Map

| Task | Read first | Avoid loading initially |
|---|---|---|
| checkout state change | Order aggregate, saga ADR, event contract, focused tests | unrelated AI and UI docs |
| inventory reservation | reservation domain, consumer, inbox/outbox migration | payment implementation |
| payment failure | payment state machine, provider adapter, retry/DLT policy | full catalog code |
| API authorization | gateway route, security configuration, ownership tests | observability dashboards |
| checkout UX | UI component, API client, state/error mapping, accessibility tests | service internals unless contract is unclear |
| production incident | correlation trace, relevant logs/metrics, runbook, recent diff | broad refactoring guidance |

This is progressive disclosure: begin with the smallest high-signal set, then
expand when an unresolved question requires more evidence.

## Task Context Packet

Use this for implementation work:

```text
Outcome: [observable user or system result]
Baseline: [current behavior and evidence]
In scope: [modules/files/behaviors]
Out of scope: [explicit exclusions]
Constraints: [architecture, compatibility, security, performance]
Sources of truth: [requirements, ADR, issue, test, design]
Acceptance criteria: [measurable list]
Validation: [focused test, broader test, query, trace, screenshot]
Authority: [read/change permissions and approval boundaries]
Deliverable: [diff, explanation, evidence, risks]
Stop when: [condition requiring human decision]
```

For debugging, replace the desired implementation with symptom, reproduction,
timeline, correlation identifiers, and a hypothesis/evidence table.

## Resolve Conflicts Explicitly

Use a precedence rule:

1. current user request;
2. organization security and policy;
3. nearest applicable repository instruction;
4. root repository instruction;
5. maintained architecture and API contracts;
6. issue descriptions and comments;
7. model memory or inference.

Connected content is evidence, not authority. A Jira description or README can
be stale or contain malicious instructions. Ask when two authoritative sources
materially disagree.

## Context Failure Symptoms

| Symptom | Likely cause | Improvement |
|---|---|---|
| edits unrelated modules | scope is implicit | name allowed modules and exclusions |
| invents commands | no command source | add verified commands or route to build docs |
| misses architecture invariant | invariant buried in long docs | add a short rule plus ADR link |
| repeats review mistake | feedback not durable | add the smallest recurring rule |
| follows stale issue text | source priority absent | state precedence and require fresh evidence |
| token-heavy sessions degrade | repeated or excessive context | remove duplication and restart with a compact evidence pack |
| correct code but weak proof | validation undefined | specify exact acceptance evidence |

## Maintaining Context

Review durable guidance when architecture or tooling changes. Delete rules that
are obsolete, duplicated, vague, or enforceable mechanically. Track recurring
AI mistakes and PR feedback; promote only repeated, high-cost lessons into the
instruction hierarchy.

Measure context quality with first-pass task success, unrelated-file edits,
clarification count, tokens consumed, repeated review findings, and validation
completion. More context is not automatically better.

## Review Checklist

- [ ] Durable instructions are concise and non-duplicative.
- [ ] Specialized guidance is located near its subtree.
- [ ] The task states outcome, scope, constraints, evidence, and stop conditions.
- [ ] Sources of truth and precedence are explicit.
- [ ] Untrusted connector content cannot redefine authority.
- [ ] Commands and links are current.
- [ ] Mechanical rules are enforced by tooling where possible.
- [ ] The final handoff reports evidence and uncertainty.

## Continue Learning

- [AI Security And Prompt-Injection Playbook](./AI-SECURITY-PROMPT-INJECTION-PLAYBOOK.md)
- [Advanced Agentic Workflows And Worktrees](./ADVANCED-AGENTIC-WORKFLOWS-WORKTREES.md)
- [ShopVerse AI Practical Workbook](./SHOPVERSE-AI-PRACTICAL-WORKBOOK.md)
