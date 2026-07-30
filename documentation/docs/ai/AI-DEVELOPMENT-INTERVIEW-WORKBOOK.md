---
title: AI-Assisted Software Development Interview Workbook
description: Scenario-based AI development interview questions with answer frameworks covering context, coding, debugging, security, RAG, evaluation, agents, performance, and user experience.
sidebar_label: AI Development Interview Workbook
difficulty: Intermediate
page_type: Interview
status: maintained
prerequisites: [AI developer toolkit, ShopVerse AI practical workbook]
technologies: [Codex, Claude Code, MCP, RAG, AI Evals, Java, Spring Boot]
last_reviewed: "2026-07-29"
scope: generic
owner: docs-ai
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# AI-Assisted Software Development Interview Workbook

These questions test engineering judgment, not product trivia. Use this answer
structure:

```text
Principle -> concrete workflow -> evidence -> risk/control -> ShopVerse example
```

Avoid claiming that AI replaces design ownership, testing, security review, or
user research.

## Foundations

### How do you use AI during the SDLC?

**Strong answer:** Use it to clarify requirements, trace architecture, compare
designs, implement bounded changes, generate edge cases, diagnose evidence,
review diffs, improve documentation, and support incidents. Match autonomy to
the request, require measurable acceptance criteria, and keep humans accountable
for material product, architecture, security, and production decisions.

### What is the difference between prompting and context engineering?

**Strong answer:** A prompt expresses the current task. Context engineering also
selects durable instructions, authoritative documents, live connector data,
tool permissions, evidence, and retrieval strategy. Better wording cannot repair
stale sources or excessive privileges.

### What belongs in `AGENTS.md` or `CLAUDE.md`?

**Strong answer:** Small durable repository rules: verified commands,
architecture invariants, routing, safety boundaries, and review expectations.
Put specialized rules near their module. Do not store temporary task details,
secrets, or a duplicated handbook there.

## Coding And Review

### How do you prevent AI from making a broad speculative change?

**Strong answer:** Separate investigation from implementation, name allowed
modules, state exclusions, request a file-level plan, approve contract decisions,
run focused tests, inspect the diff, and stop on scope expansion.

### How do you review generated tests?

**Strong answer:** Ensure tests encode requirements rather than implementation,
fail before the fix when practical, cover negative and boundary cases, exercise
the correct layer, and avoid mocks that bypass the failure. Mutation or fault
injection can reveal tests that pass without protecting behavior.

### What if two AI reviewers disagree?

**Strong answer:** Compare evidence and failure scenarios, not confidence. Reopen
the source, reproduce the claim, and use an authoritative contract or test. A
coordinator or human owns the decision.

## Debugging And Reliability

### How should AI investigate a distributed checkout failure?

**Strong answer:** Pivot on correlation and business identifiers, reconstruct
the timeline across Order, Inventory, Payment, Kafka, outbox/inbox, retries, DLT,
and compensation. Build hypotheses and discriminating checks. Do not patch the
last symptom or replay production events without approval.

### How do you preserve event ordering?

**Strong answer:** Define the required boundary, usually per aggregate. Use a
stable Kafka key, compatible partitioning, controlled consumer concurrency,
monotonic state transitions or versioning, idempotent consumers, and explicit
retry/replay semantics. Do not promise global order unless the architecture pays
its throughput and availability cost.

### Explain outbox versus inbox.

**Strong answer:** Outbox atomically records the producer’s domain change and
event intent in one local transaction, closing the database/broker dual-write
gap. Inbox durably deduplicates consumer events in the same local transaction as
their business effect. Both still require IDs, constraints, retries, retention,
and observability.

## Security And Connectors

### What is indirect prompt injection?

**Strong answer:** Malicious instructions embedded in retrieved content such as
issues, web pages, logs, or repository files. Treat retrieved text as evidence,
not authority; isolate it, restrict tools and data, and require approval for
external or privileged actions.

### How do connectors boost productivity safely?

**Strong answer:** They retrieve current issues, designs, alerts, PRs, and docs
without manual copying and can automate approved updates. Use least privilege,
resource scoping, source freshness, data classification, auditability, and a
read-versus-write boundary.

### What would make you reject an AI tool for a task?

**Strong answer:** Policy or data restrictions, unsafe privilege, unverifiable
output, missing accountable expertise, unacceptable vendor/data handling, or a
verification cost greater than doing the bounded work directly.

## Performance And User Experience

### How can AI help performance optimization?

**Strong answer:** It can correlate traces, SQL, profiles, metrics, and code;
generate hypotheses; compare fixes; and build benchmarks. Require comparable
before/after p50/p95/p99, throughput, error, CPU, and downstream load while
preserving correctness.

### How can AI improve UX without replacing user research?

**Strong answer:** It can inspect state coverage, content, responsive layouts,
accessibility, analytics, and visual evidence; generate prototypes and test
matrices; and automate browser checks. User needs, product trade-offs, behavioral
validation, and accessibility judgment remain human work.

## RAG And Evaluation

### Why might an engineering RAG answer be wrong even with citations?

**Strong answer:** Retrieval can select stale, superseded, unauthorized, poisoned,
or irrelevant passages; chunking can remove qualifiers; and generation can
misstate the source. Evaluate retrieval recall, citation correctness, grounded
claims, freshness, ACL leakage, and abstention separately.

### How do you evaluate an AI coding workflow?

**Strong answer:** Use versioned representative tasks with fixed starting states,
acceptance criteria, forbidden changes, and graders. Gate on correctness and
safety, then compare elapsed time, human effort, tokens, cost, retries, review
findings, and escaped defects.

### Why is developer acceptance rate not enough?

**Strong answer:** Developers can accept incorrect or unnecessary suggestions,
and easy suggestions inflate the metric. Combine it with review quality, rework,
production outcomes, task complexity, and controlled comparisons.

## Agentic Workflows

### When should you use multiple coding agents?

**Strong answer:** When work divides into independent evidence or isolated module
outputs and the wall-clock benefit exceeds coordination cost. Give one owner to
shared contracts and files. Avoid parallel edits while architecture is unsettled.

### Why use a Git worktree?

**Strong answer:** It isolates a branch and working directory for parallel or
long-running work without disturbing the current tree. It does not eliminate
semantic conflicts; base revision, path, ownership, integration, and cleanup
must still be controlled.

### How do you stop an autonomous agent from looping?

**Strong answer:** Define success and stop conditions, retry limits, time/token
budgets, non-repetition rules, approval boundaries, and checkpoints. After
repeated unchanged failure, preserve evidence and ask for a new decision rather
than making progressively broader changes.

## ShopVerse System-Design Scenario

**Question:** Design an AI assistant that answers ShopVerse operational questions
using documentation and observability data.

**Model-answer outline:**

1. define supported questions and safe abstention;
2. index reviewed ADRs, runbooks, contracts, and service ownership with metadata;
3. use hybrid retrieval, reranking, citations, revisions, and freshness;
4. enforce repository/document ACLs before model access;
5. connect read-only observability tools for named environments;
6. treat retrieved text as untrusted and prevent instruction following;
7. require approval for replay, restart, or ticket/message writes;
8. evaluate retrieval, grounding, incident usefulness, security leakage, latency,
   and cost using realistic checkout failures;
9. audit source IDs, tool calls, approvals, and final answers;
10. keep an on-call engineer responsible for operational decisions.

## Mock Interview Scorecard

Score 0-2 for each:

| Dimension | Strong signal |
|---|---|
| grounding | cites concrete evidence and source priority |
| engineering | explains transactions, compatibility, tests, and operations |
| safety | handles data, permissions, injection, and approval boundaries |
| measurement | uses quality, cost, latency, and outcome metrics |
| judgment | states trade-offs and when not to automate |
| communication | answers clearly with a relevant ShopVerse example |

Below 7: revisit fundamentals. From 7-9: add evidence and trade-offs. From
10-12: practice concise delivery and follow-up challenges.

## Practice Challenges

- Give a two-minute explanation of AI-assisted checkout debugging.
- Defend why an inbox uniqueness constraint is necessary under concurrency.
- Design an eval that catches an agent editing unrelated services.
- Threat-model a Jira and Sentry connector workflow.
- Explain why a faster model configuration may have a higher total task cost.
- Describe a time you rejected an AI suggestion and how you proved it wrong.

Use the [ShopVerse AI Practical Workbook](./SHOPVERSE-AI-PRACTICAL-WORKBOOK.md)
to generate evidence-backed stories for these answers.
