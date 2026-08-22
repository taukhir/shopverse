# Learning Progression Standard

This is the required teaching contract for Shopverse educational documentation.
It replaces keyword-based notions of "depth" with a reader journey that begins
with definitions and ends with implementation and operational judgment.

## Core Rule

Every educational page must be understandable in layers:

1. **Definition:** state what the subject is in plain language and name its
   boundary. Avoid defining a term with the same unexplained term.
2. **Purpose:** explain the problem it solves and when a reader encounters it.
3. **Prerequisites and terminology:** list required prior knowledge and briefly
   define unavoidable vocabulary.
4. **Beginner mental model:** provide a small diagram, analogy, table, or
   end-to-end picture that is accurate enough to build on.
5. **Minimal working example:** show the smallest concrete example and explain
   every important line, state transition, or component.
6. **Mechanics:** trace the lifecycle, algorithm, request path, data path, or
   internal execution model step by step.
7. **Boundaries and trade-offs:** explain what the mechanism does not guarantee,
   alternatives, selection criteria, and costs.
8. **Failure modes:** cover incorrect assumptions, edge cases, overload,
   recovery, and security hazards that materially apply.
9. **Production depth:** connect the concept to configuration, observability,
   diagnostics, capacity, compatibility, and operational evidence.
10. **Recall and progression:** summarize the invariant, provide a checklist or
    interview explanation, and link the next prerequisite-ordered page.

Every topic guide must also support four levels of use without forcing every
reader through every detail:

| Layer | Reader question | Required evidence |
|---|---|---|
| Beginner | What is this and why does it exist? | definition, purpose, prerequisites, terminology, mental model |
| Practitioner | How do I use it correctly? | minimal example, realistic examples, explanation, validation |
| Senior | How does it work and fail? | lifecycle or algorithm, edge cases, concurrency, limits, diagnostics |
| Lead engineer | How do I choose, govern, and operate it? | alternatives, decision criteria, security, scale, compatibility, recovery, evidence |

Depth may live on focused child pages. In that case the overview must briefly
define each child topic, explain its place in the whole, and link it in learning
order. A link without a useful summary is not topic coverage.

An advanced page may summarize fundamentals and link to a canonical prerequisite
instead of repeating an entire beginner guide. It may not start with unexplained
internals, configuration, code, or interview questions.

## Required Opening

The first screen of a page should answer:

- What is this?
- Why does it exist?
- What should I know first?
- What will I be able to explain or do after reading?

Use a short `## Page Overview` or equivalent immediately after the opening when
the page has more than one major section. It should describe the page boundary,
list the topics in one sentence each, and state which details intentionally live
on linked pages.

A good definition identifies the broader category and the distinguishing
behavior. For example, "A transactional outbox is a reliability pattern that
stores a domain change and an integration-event intent in the same local
database transaction" is testable and bounded. "An outbox handles events" is
not sufficient.

## Canonical Section Order

Use these headings when they fit the topic. Equivalent reader-facing wording is
allowed, but the progression must remain visible.

```text
# Topic

opening definition and purpose

## Page Overview
## Prerequisites
## Core Terminology
## Mental Model
## First Working Example
## Example Progression
## How It Works
## Internal Lifecycle Or Algorithm
## Boundaries And Trade-Offs
## Failure Modes, Edge Cases, And Common Mistakes
## Production And Diagnostic Guidance
## Version Or Compatibility Notes        (when relevant)
## Tricky Interview Questions
## Summary / Review Checklist
## Recommended Next
## Official References
```

## Example Coverage

One happy-path snippet is not full example coverage. A topic guide should include
the examples that materially change the reader's judgment:

1. the smallest valid example, with important lines or state transitions
   explained;
2. a realistic application example with inputs, outputs, and assumptions;
3. an invalid or failing example that explains the symptom and root cause;
4. an edge-case example for null/empty/boundary values, concurrency, retry,
   overload, compatibility, or security when relevant;
5. a production example showing configuration, diagnostics, tests, or measured
   evidence rather than an unverified command dump.

Examples must identify what the reader should observe and how to verify it. Do
not repeat near-identical examples merely to increase the count.

## Interview Coverage

Every educational topic page must end with questions that test reasoning rather
than trivia. Include at least:

- one definition or boundary question;
- one "predict the behavior" example;
- one failure-diagnosis or edge-case question;
- one lead-engineer trade-off question with constraints and a model-answer
  outline or evaluation points.

Large question banks remain separate practice pages. Topic pages own a small,
high-value set and link to the relevant bank for additional practice.

## Naming And Topic Boundaries

- Use a short, specific visible title, normally two to seven words. Put product
  context in the title only when it distinguishes two genuinely different topics.
- Use Title Case for visible titles and sentence case for section headings.
- Avoid title chains such as `Internals Performance Production Interview`.
  Split competing reader goals into focused pages instead.
- Use an overview/umbrella page for a domain, not as a container for several full
  deep dives. Each child page owns one coherent reader question.
- Keep stable document IDs when renaming would break links. Prefer a concise
  front-matter `title` and `sidebar_label`; migrate filenames only with redirects
  and a repository-wide link update.
- Do not encode difficulty in the title. Difficulty belongs in metadata and the
  learning path.

## Page-Type Adaptations

| Page type | Required beginner entry | Required depth |
|---|---|---|
| Learning Path | define the domain, audience, starting knowledge, and ordered route | explain why the order exists and where each branch leads |
| Guide / Tutorial | definition, terminology, prerequisites, first example | mechanics, trade-offs, failures, production use, verification |
| Concept / Deep Dive | short fundamentals recap with canonical prerequisite links | internals, lifecycle, invariants, edge cases, evidence |
| Decision Guide | define every option and decision context | comparison criteria, failure costs, migration and rollback |
| Reference | explain scope and how to use the reference | precise contracts, limits, compatibility, cross-links |
| Runbook | define the symptom/system and safety boundary | diagnosis, evidence, recovery, rollback, verification |
| Case Study | define the generic concept and current Shopverse scope | repository evidence, runtime flow, gaps, recovery and validation |
| Lab / Workbook / Practice / Interview | define what is being practiced and link prerequisites | exercises progress from recall to implementation and failure diagnosis |

## Depth Is Not Length

A page is deep when it explains causality and boundaries, not when it accumulates
headings, posters, commands, or interview questions. Depth requires answers to:

- What state exists, and who owns it?
- What sequence changes that state?
- What invariant must remain true?
- What happens under concurrency, retries, partial failure, or overload?
- Which evidence proves the explanation in a running system?
- Which version, implementation, or deployment assumption limits the claim?
- Which edge case invalidates the simple mental model?
- What would a lead engineer measure or require before accepting this design?

## Topic Ownership And Grouping

- One page owns the canonical definition of a concept.
- Umbrella pages teach sequence and route readers; they do not duplicate deep
  explanations.
- Focused pages answer one coherent reader question.
- Generic theory and Shopverse implementation remain separate and cross-linked.
- Navigation progresses from fundamentals to mechanics, deep dives, practice,
  and operations.
- Historical/version comparisons follow the stable definition instead of
  replacing it.

## Prohibited Remediation

Do not satisfy this standard by inserting generic sections such as "Definition",
"Failure Modes", or "Production" with reusable filler. Each addition must name
the actual concept, boundary, example, and failure. Automated audits identify
review queues; they do not author technical truth.

Likewise, do not add generic interview questions, decorative diagrams, or several
minor code variants to satisfy an audit. Every question, visual, and example must
teach a decision, mechanism, boundary, or failure that is specific to the topic.

## Repository Audit

Run:

```powershell
node scripts/audit-learning-progression.mjs
```

The complete per-page result is written to:

- `reports/learning-progression-audit.json`
- `reports/learning-progression-audit.md`

Use `--strict` only for a bounded track after that track has been remediated.
Repository-wide strict mode intentionally remains red until every page has been
reviewed by topic owners.
