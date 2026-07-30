# Implement A Bounded Feature

Use this workflow when the requested behavior is understood well enough to plan
and implement. Replace every bracketed placeholder before allowing edits.

## Inputs

```text
Outcome: [observable user or system result]
Requirement source: [issue, document, conversation, or contract]
Baseline: [current behavior and evidence]
In scope: [modules and behavior]
Out of scope: [explicit exclusions]
Compatibility constraints: [API, event, database, client, or none]
Security/privacy constraints: [requirements]
Acceptance criteria: [measurable list]
Validation expected: [tests, build, query, trace, screenshot]
Authority: [read-only, local edits, or another explicit boundary]
```

## Workflow Prompt

```text
Follow the repository AGENTS.md hierarchy. Preserve unrelated working-tree work.

First investigate without editing:
1. trace the current behavior from entry point through domain, persistence,
   integration events, UI, and tests as applicable;
2. cite the relevant files and symbols;
3. identify ambiguity, compatibility concerns, security risks, migrations, and
   cross-service effects;
4. propose the smallest coherent plan and list every expected file change;
5. define focused tests that would fail without the change.

Stop for approval if the plan requires an API/event contract change, forward-only
database migration, new dependency, external write, privileged action, destructive
action, or material expansion beyond the stated scope.

If implementation is authorized and no approval gate is triggered:
1. implement only the approved scope using existing conventions;
2. run the narrowest relevant test first;
3. repair only failures caused by the change;
4. run the broader module validation justified by the risk;
5. review the final diff for correctness, unrelated edits, security, transaction
   boundaries, compatibility, observability, and test quality.

Return:
- outcome and changed behavior;
- changed files and why;
- validation commands and results;
- acceptance-criterion mapping;
- decisions requiring human ownership;
- residual risks and validation not performed.

Never claim success from generated code alone.
```

## ShopVerse Review Prompts

Ask the following when applicable:

- Does Order, Inventory, Payment, or the web application own this behavior?
- Does checkout idempotency change?
- Could duplicate or out-of-order Kafka delivery repeat an effect?
- Do domain state and outbox intent remain atomic?
- Which producers and consumers share the event contract?
- Does authorization protect the object at the service boundary?
- Are customer-safe messages, metrics, traces, and recovery evidence preserved?
