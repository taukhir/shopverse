---
title: System Design Interview Evaluation Rubric
difficulty: Advanced
page_type: Reference
status: Generic
keywords: [system design interview, scoring rubric, trade-off evaluation]
learning_objectives: [Evaluate designs consistently, Identify shallow box-diagram answers, Improve trade-off communication]
technologies: [System Design]
last_reviewed: "2026-07-12"
---

# System Design Interview Evaluation Rubric

| Area | Points | Strong evidence |
|---|---:|---|
| requirements/NFR priorities | 10 | clarifies and ranks conflicts |
| scale estimates | 10 | workload-shaped arithmetic with peaks/headroom |
| APIs/events/invariants | 10 | explicit identity, correctness, errors, idempotency |
| data/access design | 15 | queries drive schema/index/partition/retention |
| architecture and critical flows | 15 | clear ownership and sequence under success/failure |
| consistency and reliability | 15 | transactions, staleness, replay, recovery, RPO/RTO |
| scaling and overload | 10 | hotspots, bounds, backpressure and degradation |
| security/operations/cost | 10 | tenant/PII, observability, deploy/restore and unit cost |
| alternatives/evolution | 5 | credible rejections and migration triggers |

## Warning Signs

- naming technologies before requirements/access patterns;
- “NoSQL for scale” or “Kafka for reliability” without semantics;
- averages without peaks/skew or storage/index/replication overhead;
- diagrams without authoritative data ownership;
- retries without deadlines/idempotency;
- queues, pools or caches without bounds;
- replicas assumed to scale writes;
- no behavior for partial failure/in-flight requests;
- no rejected alternatives or operational path.

## Communication Pattern

State assumption, consequence, choice and trade-off: “Because writes for one
conversation require order but conversations are independent, partition by
conversation ID; this preserves per-conversation order while hot groups need a
separate fan-out strategy.” Mark uncertainty and name the benchmark/failure test
that would resolve it.

Score is secondary to coherent reasoning. A simpler design with correct ownership,
bounds and evolution is stronger than a diagram containing every fashionable tool.
