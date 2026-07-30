---
title: Advanced Agentic Development Workflows And Worktrees
description: Coordinate planning, implementation, testing, review, subagents, worktrees, recovery, and evidence for safe parallel software development.
sidebar_label: Agentic Workflows And Worktrees
difficulty: Advanced
page_type: Reference
status: maintained
prerequisites: [AI context engineering, Git branching, AI security]
technologies: [Codex, Claude Code, Git Worktrees, Subagents, CI]
last_reviewed: "2026-07-29"
scope: generic
owner: docs-ai
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Advanced Agentic Development Workflows And Worktrees

Agentic development combines model reasoning with repository tools and feedback
loops. Parallelism helps only when work can be divided into independent,
bounded outputs. It increases coordination cost when several agents modify the
same contracts, migrations, or files.

Codex documents subagents and Git worktrees as distinct capabilities: subagents
delegate specialized work, while worktrees isolate branches and working
directories. See [Codex subagents](https://developers.openai.com/codex/multi-agent)
and [Git worktrees](https://developers.openai.com/codex/app/worktrees).

## Workflow Shapes

| Shape | Use when | Avoid when |
|---|---|---|
| single agent | task is cohesive or edits overlap | independent research dominates |
| investigator plus implementer | cause must be established first | requirements are already trivial |
| parallel read-only review | security, tests, performance can inspect independently | reviewers need unfinished edits |
| parallel isolated implementation | changes have clean module boundaries | shared contract is still changing |
| staged pipeline | each phase has an explicit artifact and gate | rapid exploration needs backtracking |

The default should remain one accountable workflow. Add agents only for a named
latency or specialization benefit.

## Decomposition Contract

Every delegated task needs:

- one concrete deliverable;
- required context and source priority;
- file or system scope;
- allowed reads, writes, and commands;
- acceptance criteria;
- evidence format;
- stop conditions;
- ownership of integration decisions.

Bad delegation: “Handle payment.” Good delegation: “Inspect payment failure
handling read-only and return verified state transitions, missing tests, and file
references; do not propose event-contract changes.”

## Safe Parallel ShopVerse Example

For checkout reliability analysis:

```text
Coordinator: owns question, architecture decisions, and final synthesis
  |-- Order investigator: state machine and event publication, read-only
  |-- Inventory investigator: reservation and duplicate handling, read-only
  |-- Payment investigator: failure, retry, and compensation, read-only
```

This parallel read is safe because outputs are evidence reports. After synthesis,
one implementation owner makes the cross-service contract change. Parallel
contract edits would risk incompatible assumptions.

## Worktree Strategy

Use an isolated worktree when a task needs a separate branch, dependencies,
generated files, or long-running validation. Before creating one:

1. identify the repository and intended base revision;
2. verify the target path and branch do not conflict;
3. define which task owns the worktree;
4. avoid sharing mutable build caches that are not concurrency-safe;
5. decide how results will be reviewed and integrated;
6. preserve the user’s current dirty working tree.

Do not use worktrees as a substitute for decomposing overlapping edits. Two
branches can still create semantic merge conflicts.

## Plan, Execute, Verify, Review

```text
Coordinator creates acceptance contract
  -> investigators gather evidence
  -> human approves material design choices
  -> implementation owner changes bounded scope
  -> test owner runs focused and broader validation
  -> independent reviewer inspects diff and residual risk
  -> coordinator integrates evidence and hands off
```

Do not let the same generated explanation serve as both implementation rationale
and independent proof. Tests, build output, queries, traces, and a fresh review
provide stronger evidence.

## Conflict Prevention

- assign one owner per file and shared contract;
- freeze API/event decisions before parallel implementation;
- exchange structured findings, not unbounded chat summaries;
- communicate new blockers immediately;
- never silently rewrite another task’s changes;
- integrate in dependency order;
- rerun validation after integration, not only on each branch.

## Retry And Recovery Limits

Agent loops need budgets:

```text
Retry transient tool failures at most twice.
Do not repeat an unchanged test after the same failure.
After two unsuccessful fix attempts, stop editing, preserve evidence, summarize
the hypotheses tried, and request a new decision.
```

Checkpoint useful artifacts before context compaction or handoff: current goal,
changed files, tests, failures, decisions, and remaining work. Never label a task
complete because its time or token budget ended.

## Agentic Review Roles

Useful read-only roles include:

- correctness and transaction reviewer;
- security and privacy reviewer;
- event-contract and compatibility reviewer;
- test-quality reviewer;
- performance evidence reviewer;
- UX and accessibility reviewer.

Their findings must contain a failure scenario and precise evidence. The
coordinator deduplicates, resolves contradictions, and decides what is actionable.

## Metrics

Measure wall-clock improvement against coordination overhead, total tokens,
duplicate reading, merge conflicts, review findings, failed integrations, and
acceptance rate. Parallel work that finishes sooner but requires extensive
reconciliation is not necessarily more efficient.

## Checklist

- [ ] The task benefits from delegation or isolation.
- [ ] Each task has a bounded independent deliverable.
- [ ] Shared files and contracts have one owner.
- [ ] Worktree base, path, branch, and cleanup responsibility are explicit.
- [ ] External, destructive, and privileged actions retain approval gates.
- [ ] Retry and stopping limits prevent loops.
- [ ] Integration order and final validation are defined.
- [ ] A coordinator owns final correctness and communication.

Continue with [AI Development Interview Workbook](./AI-DEVELOPMENT-INTERVIEW-WORKBOOK.md).

## Official References

- [Git worktree documentation](https://git-scm.com/docs/git-worktree)
- [OpenAI Agents guide](https://platform.openai.com/docs/guides/agents)
