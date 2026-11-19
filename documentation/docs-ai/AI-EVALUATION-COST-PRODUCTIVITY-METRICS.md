---
title: AI Evaluation, Cost, And Developer Productivity Metrics
description: Evaluate AI-assisted engineering with representative tasks, quality gates, cost and latency measures, delivery outcomes, and controlled experiments.
sidebar_label: Evaluation And Metrics
difficulty: Intermediate
page_type: Reference
status: maintained
prerequisites: [AI-assisted SDLC, Software delivery metrics]
technologies: [AI Evals, CI, Git, Observability, Experiment Design]
last_reviewed: "2026-07-29"
scope: generic
owner: docs-ai
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# AI Evaluation, Cost, And Developer Productivity Metrics

AI productivity is not lines of generated code. Measure whether representative
work reaches an acceptable result faster, with equal or better quality, safety,
and maintainability.

## Measurement Layers

| Layer | Question | Example metrics |
|---|---|---|
| task quality | did the output satisfy the task? | acceptance-criterion pass rate, reviewer findings |
| process | how much work was required? | elapsed time, active time, turns, retries, rework |
| delivery | did team flow improve? | lead time, cycle time, deployment frequency |
| quality | did defects move downstream? | escaped defects, rollback rate, change failure rate |
| economics | was the outcome worth the resources? | tokens, tool calls, compute, engineer time, cost/task |
| experience | can developers control and trust it? | satisfaction, interruption rate, perceived ownership |

Use balanced metrics. Optimizing completion speed alone encourages large unsafe
changes and weak validation.

## Build A Representative Eval Set

Create versioned tasks from real work:

- trace a ShopVerse checkout flow;
- fix a validation bug with a regression test;
- diagnose a Kafka duplicate-delivery problem;
- review an authorization diff;
- optimize a measured SQL bottleneck;
- improve a checkout failure state accessibly;
- update documentation while preserving navigation.

For each task store the starting revision, prompt, allowed tools, time budget,
acceptance criteria, required evidence, forbidden changes, and grading method.
Never tune only against one favorite example.

## Grading Rubric

Score each dimension independently:

| Dimension | Fail | Partial | Pass |
|---|---|---|---|
| correctness | behavior wrong | happy path only | all criteria and edge cases |
| scope | unrelated changes | minor excess | bounded diff |
| evidence | claims only | focused check | layered reproducible proof |
| security | creates weakness | uncertain review | required controls preserved |
| maintainability | fights conventions | acceptable | idiomatic and explained |
| communication | hides uncertainty | incomplete caveats | facts, inference, and risks clear |

Use deterministic tests where possible and human review for design quality.
Blind the reviewer to tool configuration when comparing alternatives.

## Cost Model

Calculate complete task cost:

```text
AI cost
  = input tokens + output tokens + cached context + tool/runtime charges

Total task cost
  = AI cost + engineer active time + review time + CI/runtime cost + rework
```

Track median and tail cost. A workflow that is cheap usually but enters expensive
loops on 10% of tasks needs explicit retry and stop limits.

## Productivity Scorecard

| Metric | Baseline | AI-assisted | Guardrail |
|---|---:|---:|---:|
| accepted tasks/attempts | record | record | increase |
| median active minutes | record | record | decrease |
| review findings/task | record | record | no increase |
| rework minutes | record | record | decrease |
| escaped defects | record | record | no increase |
| tokens and cost/task | n/a | record | within budget |
| developer satisfaction | record | record | improve |

Do not convert saved minutes directly into headcount claims. Productivity gains
may appear as better testing, more documentation, faster learning, or reduced
interruptions rather than additional features.

## Controlled Comparison

1. select tasks before choosing the preferred setup;
2. preserve the same starting state and acceptance criteria;
3. compare model, prompt, context, and tool changes one variable at a time;
4. repeat enough times to expose variance;
5. include failures, retries, and human review cost;
6. segment by task type and complexity;
7. decide using quality gates first, then latency and cost.

OpenAI’s current model guidance also recommends representative evaluations when
changing prompts, tools, reasoning effort, or execution mode. See [model guidance](https://developers.openai.com/api/docs/guides/latest-model).

## Failure Taxonomy

Label failures so improvement targets the real cause:

- missing or stale context;
- ambiguous acceptance criteria;
- hallucinated repository fact;
- incorrect implementation reasoning;
- tool or environment failure;
- excessive scope;
- weak or misleading test;
- security or privacy violation;
- unrecoverable loop;
- human requirement or review error.

Do not repair every failure with a longer prompt. Some require a test, a cleaner
API, better documentation, narrower tools, or a different task boundary.

## Dashboard And Review Cadence

Review weekly operational signals and monthly outcome trends. Sample completed
tasks manually to prevent metric gaming. Retire prompts or agent configurations
that are expensive without measurable quality gains.

Record model/tool version, repository revision, context package, prompt version,
and environment so results are reproducible. Avoid comparing historical scores
after silently changing the grader.

## Adoption Gates

- [ ] representative evals pass at the agreed threshold;
- [ ] critical security and scope failures are zero;
- [ ] quality is non-inferior to the baseline;
- [ ] cost and tail latency fit the workflow;
- [ ] developers can inspect, stop, and recover the agent;
- [ ] data use and connectors meet policy;
- [ ] metrics include review and rework, not generation alone.

Continue with [RAG For Engineering Documentation](./RAG-FOR-ENGINEERING-DOCUMENTATION.md)
to improve grounded retrieval and measure it separately from answer generation.
