---
title: "Correlation And Trace Propagation"
description: "Propagate identity across gateway, servlet, HTTP, Kafka, and asynchronous boundaries."
sidebar_label: "Correlation And Trace Propagation"
tags: ["shopverse", "architecture", "production"]
page_type: "Learning Path"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

<!-- split-guide-index -->
# Correlation And Trace Propagation

<DocLabels items={[{label: 'Focused guides', tone: 'advanced'}, {label: 'Shopverse', tone: 'shopverse'}, {label: 'Architect route', tone: 'production'}]} />

Propagate identity across gateway, servlet, HTTP, Kafka, and asynchronous boundaries. The original long-form material is preserved without duplication across the focused pages below.

```mermaid
flowchart LR
    P1["Correlation Identifiers And HTTP Propagation"]
    P2["MDC, Kafka, And Async Propagation"]
    P1 --> P2
```

<TopicCards items={[
  {title: 'Correlation Identifiers And HTTP Propagation', href: '/observability/CORRELATION-IDENTIFIERS-HTTP-PROPAGATION', description: 'Part 1 of the focused Correlation And Trace Propagation learning route.', icon: 'route', tags: ['Focused', 'Advanced']},
  {title: 'MDC, Kafka, And Async Propagation', href: '/observability/MDC-KAFKA-ASYNC-PROPAGATION', description: 'Part 2 of the focused Correlation And Trace Propagation learning route.', icon: 'security', tags: ['Focused', 'Advanced']},
]} />

<DocCallout type="tip" title="Use the index as the stable entry point">

Each focused page owns one concern. Cross-links point to the canonical explanation instead of repeating the same material.

</DocCallout>

## Recommended Learning Order

1. [Correlation Identifiers And HTTP Propagation](./CORRELATION-IDENTIFIERS-HTTP-PROPAGATION.md)
2. [MDC, Kafka, And Async Propagation](./MDC-KAFKA-ASYNC-PROPAGATION.md)


## Reading Strategy

Use **Correlation And Trace Propagation** as a decision and verification guide inside **Correlation And Trace Propagation**. Start by naming the invariant or operational outcome, then follow the runtime flow and identify the owning component. For every example, record the expected success evidence, the most important failure mode, and the metric or test that proves recovery. This keeps the material useful for implementation reviews, production incidents, and architect interviews instead of treating it as isolated syntax.

Within **Correlation And Trace Propagation**, apply the Shopverse guidance incrementally: verify the current behavior, introduce one bounded change, test the unhappy path, and preserve a rollback or reconciliation route. Follow links to canonical pages when a concept belongs to another track; do not copy that explanation into this page. This ownership rule keeps the focused guides short while retaining technical depth and traceability.

## Official References

- [Micrometer documentation](https://docs.micrometer.io/micrometer/reference/)
- [OpenTelemetry documentation](https://opentelemetry.io/docs/)
