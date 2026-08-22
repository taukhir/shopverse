---
title: Documentation Learning Quality Audit And Backlog
difficulty: Beginner
page_type: Reference
status: maintained
learning_objectives: [Understand current documentation quality gaps, Prioritize consolidation and visual work, Track structural remediation]
technologies: [Docusaurus]
last_reviewed: "2026-08-04"
scope: generic
owner: docs-reference
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Documentation Learning Quality Audit And Backlog

Documentation quality means that a new reader can define a subject, build a
correct mental model, follow one concrete example, understand the internal
mechanics, and reason about trade-offs and failures. A page is not complete only
because it has metadata, a table, an official link, or a place in the sidebar.

The automated audits are advisory: they identify pages needing human review
rather than deleting or rewriting content automatically. Run
`npm run audit:learning-progression` for the learning audit and
`npm run check:docs:audit` for the older structural audit.

## Current Baseline

| Signal | Count | Interpretation |
|---|---:|---|
| pages scanned | 938 | complete Markdown/MDX library |
| fully meeting progression contract v2 | 43 | four entry/reference pages plus thirty-nine Java foundation, JVM, and Collections pages |
| JVM reference track | 10 | first complete v2 technical slice, from architecture through memory, GC, containers, and profiling |
| Java foundation slice | 8 | Core Java, OOP, collections, threading, fundamentals, generics, exceptions, and streams are now correctly separated across paths and focused guides |
| Collections reference slice | 20 | selection, family overviews, concrete List/Set/Map/Queue internals, mutation, ordering, and concurrency now form one complete learning path |
| missing a beginner opening | 832 | definition/order is the dominant repository-wide gap |
| missing an explicit definition | 486 | many pages assume terminology instead of teaching it |
| missing a substantial introduction | 492 | pages often start with code, tables, or advanced detail |
| missing prerequisites | 504 | readers cannot determine required prior knowledge |
| missing terminology coverage | 788 | important terms are used before their boundaries are established |
| missing failure-mode teaching | 474 | happy-path coverage is much stronger than failure reasoning |
| missing explicit edge-case coverage | 522 | many examples do not test the simple mental model at its boundary |
| missing example progression | 129 | topic/practice pages lack multiple materially different examples |
| missing tricky interview questions | 479 | educational pages often test recall instead of constrained reasoning |
| missing internal cross-links | 474 | prerequisite, canonical, or next-depth navigation is incomplete |
| titles needing review | 11 | visible titles exceed the concise-title threshold or are missing |
| conceptual pages missing deep-dive evidence | 589 | internals, trade-offs, or production evidence is incomplete |
| average progression score | 49% | stricter v2 baseline; compare compliant tracks as well as the aggregate |

## Consolidation Result

The exact-prose and five-word-shingle semantic audits find no page pair above the
configured duplication thresholds after code samples are excluded. No destructive
merge is justified. Canonical ownership is recorded in the
[maintenance map](./DOCUMENTATION-MAINTENANCE-MAP.md) for SAGA/outbox, Spring
Security, Java/Spring internals, databases, schedulers, REST, and system design.

## Why The Previous Audit Passed Bad Pages

The depth audit treats word count, a visual/table, an official-reference section,
and keyword matches such as `performance` or `failure` as evidence of quality.
That is useful for detecting empty pages but cannot prove teaching order,
definitions, causal explanation, or coherent topic ownership. It reports all
pages above their old page-type threshold while the stricter v2 learning audit
finds only forty-three compliant pages. Both results are technically correct for
their different questions; only the learning audit addresses reader comprehension.

## Required Page Progression

Every educational page must move through these layers:

1. definition and purpose;
2. prerequisites and terminology;
3. beginner mental model;
4. minimal working example;
5. mechanics, lifecycle, or algorithm;
6. boundaries and trade-offs;
7. failure modes and common mistakes;
8. production, security, performance, and diagnostic evidence where relevant;
9. tricky interview questions that test prediction, diagnosis, and trade-offs;
10. summary and prerequisite-ordered next page.

Examples must progress from minimal to realistic, failing, edge-case, and
production evidence where those variants materially apply. Visible titles should
normally contain two to seven words; stable filenames remain until a redirect-
backed migration can preserve existing links.

The authoritative rules and page-type adaptations are in
`documentation/governance/learning-progression-standard.md`.

## Remediation Order

| Phase | Scope | Exit condition |
|---|---|---|
| 1 | top-level entry points and every learning-path/umbrella page | each domain exposes a beginner-to-advanced sequence with no competing route |
| 2 | Java, JVM, Spring, and data foundations | canonical definitions and prerequisites exist before internals and production pages |
| 3 | architecture, integration, reliability, and security | overlapping ownership is resolved and failure semantics are taught explicitly |
| 4 | operations, observability, cloud, platform, and AI | beginner concepts connect to operational evidence and diagnostics |
| 5 | case studies, references, labs, workbooks, and interview pages | practice pages link canonical teaching pages and progress from recall to diagnosis |

Within each phase, remediate one coherent track completely before spreading
small edits across hundreds of pages. Repository-wide automated insertion is
prohibited because generic filler would make the reported score better while
leaving the documentation just as unclear.

## Track Exit Criteria

A domain leaves the backlog only after a human reviewer verifies all of the
following, not merely after the audit score reaches 100%:

1. one overview owns the topic map and learning order;
2. every child page has one coherent reader goal and a concise visible title;
3. definitions, prerequisites, terminology, examples, internals, edge cases,
   failures, diagnostics, and decision boundaries are technically correct;
4. code and configuration examples identify expected output and validation;
5. tricky questions include answer signals for behavior prediction, incident
   diagnosis, and lead-engineer trade-offs;
6. generic claims cite primary sources and Shopverse claims cite repository or
   runtime evidence;
7. links, navigation, responsive visuals, language checks, and production build
   pass for the remediated track.

The generated audit report contains the complete naming queue and the exact gap
list for each page. It is the work queue; it is not evidence that an automated
rewrite would be correct.

## Navigation Status

Sidebar reachability is complete, but reachability is not learning order. Several
tracks expose multiple umbrellas, overlapping pages, or advanced pages before
their prerequisites. Navigation is therefore considered **structurally
connected but pedagogically unverified** until each domain passes the progression
review.

## Link Status

The official-source checker verifies 292 unique links: **292 reachable, 0 broken**.
Rate-limited responses are reported separately, and redirect targets are recorded
in `reports/official-link-check.json` for maintenance.
