# ShopVerse AI Workflows

This directory contains reviewed, tool-neutral prompts and evidence templates for
AI-assisted development. It works with Codex, Claude Code, or another approved
coding assistant. Nothing here is loaded automatically; choose only the workflow
needed for the current task.

Durable repository rules remain in `AGENTS.md`. Claude Code imports those rules
through `CLAUDE.md`. This directory is for task-specific procedures that would
add unnecessary context if loaded into every session.

## How To Use A Workflow

1. Start the AI tool from the ShopVerse repository root.
2. Ask it to read the selected prompt and `ai-workflows/templates/task-context.md`.
3. Supply real values for every required placeholder.
4. Keep investigation read-only until the workflow reaches an implementation
   gate and the task authorizes changes.
5. Review proposed scope, external actions, migrations, and contract decisions.
6. Require the workflow's validation evidence before accepting completion.

Example request:

```text
Read ai-workflows/prompts/debug-distributed-checkout.md and follow it for this
incident. Use order number ORD-EXAMPLE and correlation ID corr-example. The
environment is local. Investigation is read-only; do not replay events, restart
services, or mutate databases.
```

Do not paste credentials, tokens, payment data, customer-sensitive fields, or
unapproved production content into any AI tool.

## Prompt Catalog

| Prompt | Use it for | Default authority |
|---|---|---|
| [Implement a feature](prompts/implement-feature.md) | bounded implementation from requirements through proof | local in-scope edits |
| [Debug distributed checkout](prompts/debug-distributed-checkout.md) | trace Order, Inventory, Payment, Kafka, and recovery | read-only investigation |
| [Review a Kafka consumer](prompts/review-kafka-consumer.md) | ordering, duplicates, retries, inbox, and side effects | read-only review |
| [Optimize performance](prompts/optimize-performance.md) | evidence-led latency, throughput, SQL, CPU, or UX optimization | read-only until experiment approval |
| [Security review](prompts/security-review.md) | actionable authorization, injection, data, event, and configuration findings | read-only review |
| [UX and accessibility review](prompts/ux-accessibility-review.md) | behavior, responsive design, keyboard, assistive technology, and performance | read-only review |
| [Update documentation](prompts/documentation-update.md) | evidence-backed docs with navigation and production validation | documentation-only edits |
| [Investigate an incident](prompts/incident-investigation.md) | structured operational diagnosis and safe recovery proposal | read-only investigation |

## Templates

| Template | Purpose |
|---|---|
| [Task context](templates/task-context.md) | define outcome, authority, scope, constraints, and proof |
| [Evidence record](templates/evidence-record.md) | capture facts, commands, outputs, decisions, and uncertainty |
| [Review report](templates/review-report.md) | report actionable findings and residual risk consistently |
| [Performance scorecard](templates/performance-scorecard.md) | compare valid before-and-after measurements |

## Executable Evaluations

The [AI evaluation suite](evals/README.md) provides six deterministic ShopVerse
scenarios for architecture discovery, Kafka duplicate review, authorization,
bounded implementation, documentation, and performance diagnosis. It scores a
standard result JSON without calling a paid model API.

## Maintenance Rules

- Keep prompts independent of a specific model name or subscription tier.
- Reference repository instructions instead of duplicating them.
- Add a rule only when it materially affects the workflow.
- Verify commands against build files before changing them.
- Version prompt changes through normal review.
- Evaluate prompt changes on representative tasks; a longer prompt is not
  automatically a better prompt.
- Keep examples synthetic and free of secrets or personal data.
- Validate evaluation changes with
  `node ai-workflows/evals/scripts/validate-suite.mjs`.

## Completion Standard

A workflow is complete only when the requested outcome is satisfied, relevant
validation has run, the final diff or evidence has been reviewed, and remaining
risks are explicit. Token or time exhaustion is not completion.
