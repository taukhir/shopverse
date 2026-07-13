---
title: Documentation Quality Audit And Backlog
difficulty: Beginner
page_type: Reference
status: Generic
learning_objectives: [Understand current documentation quality gaps, Prioritize consolidation and visual work, Track structural remediation]
technologies: [Docusaurus]
last_reviewed: "2026-07-12"
---

# Documentation Quality Audit And Backlog

The automated audit is advisory: it identifies pages needing human review rather
than deleting or rewriting content automatically. Run `npm run check:docs:audit`.

## Current Baseline

| Signal | Count | Interpretation |
|---|---:|---|
| pages scanned | 427 | full documentation library |
| repeated prose groups | 0 | fenced examples are excluded; semantic audit also reports zero |
| advanced pages without official references | 0 | all advanced pages link primary sources |
| text-heavy pages without a visual/table | 0 | visual audit accepts SVG, Mermaid, tables, and interactive roadmaps |
| learning pages without recommended next | 0 | learning-flow gap closed |
| sidebar-orphan candidates | 0 | every page is reachable |

## Consolidation Result

The exact-prose and five-word-shingle semantic audits find no page pair above the
configured duplication thresholds after code samples are excluded. No destructive
merge is justified. Canonical ownership is recorded in the
[maintenance map](./DOCUMENTATION-MAINTENANCE-MAP.md) for SAGA/outbox, Spring
Security, Java/Spring internals, databases, schedulers, REST, and system design.

## Visual And Depth Result

The owned library now covers JVM memory, threads, happens-before, AQS, JIT/GC/
collections/JMH, virtual-thread pinning, Spring context/proxy/transaction/MVC/
Hibernate/pools/shutdown, database saturation, distributed components, scheduler
fencing, the system-design method, and fifteen case-study architectures.

Depth results: **L0 0, L1 55, L2 283, L3 89**. All pages meet the minimum for
their page type; concise references, indexes, ADRs, and implementation notes are
not forced to imitate deep tutorials. The JSON report records every page's score
and individual evidence criteria.

## Navigation Status

The Java keywords page, visual standard, and audit are explicitly placed in the
sidebar. Umbrellas own learning order; deep pages should contain recommended-next
links. Route, metadata, internal-link, image, responsive, and accessibility checks
remain automated.

## Link Status

The official-source checker verifies 292 unique links: **292 reachable, 0 broken**.
Rate-limited responses are reported separately, and redirect targets are recorded
in `reports/official-link-check.json` for maintenance.
