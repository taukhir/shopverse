---
title: "Shopverse Capacity Worked Example"
description: "Shopverse Capacity Worked Example with Shopverse examples, failure analysis, and production guidance."
sidebar_label: "Shopverse Capacity Worked Example"
tags: ["shopverse", "architecture", "production"]
page_type: "Guide"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# Shopverse Capacity Worked Example

<DocLabels items={[{label: 'Advanced', tone: 'advanced'}, {label: 'Shopverse', tone: 'shopverse'}, {label: 'Production', tone: 'production'}]} />

## Worked Checkout Estimate

Assumptions:

```text
peak incoming checkout rate:        500 requests/second
average HTTP acceptance latency:    200 ms
p95 HTTP acceptance latency:        500 ms
events per checkout:                5
average event size:                 2 KB
database operations per checkout:   4
average DB connection hold time:    20 ms per operation
safe service capacity per instance: 150 requests/second
```

Calculations:

```text
average active HTTP requests:
500 x 0.200 = 100

p95 in-flight estimate:
500 x 0.500 = 250

Kafka event throughput:
500 x 5 = 2,500 records/second

raw Kafka ingress:
2,500 x 2 KB = approximately 5 MB/second

database operation rate:
500 x 4 = 2,000 operations/second

average database connection concurrency:
2,000 x 0.020 = 40 connections

throughput instances:
ceiling(500 / 150) = 4

with one-instance failure tolerance:
5 instances
```

These numbers are hypotheses until load tests confirm them. Validate:

- p50, p95, and p99 latency;
- error and timeout rate;
- active request and queue count;
- CPU, memory, GC, and thread saturation;
- database connection acquisition and query time;
- Kafka producer latency and consumer lag;
- behavior during one-instance and dependency failure.

## RED, USE, And Business Metrics

Use multiple metric models:

### RED For Request-Driven Services

- **Rate:** requests per second;
- **Errors:** failed requests per second or ratio;
- **Duration:** latency distribution.

### USE For Resources

- **Utilization:** percentage busy;
- **Saturation:** queued or waiting work;
- **Errors:** resource-level failures.

### Business Metrics

- checkouts started and completed;
- payment authorization success/decline;
- inventory reservation conflicts;
- active, failed, and compensated SAGAs;
- order confirmation duration.

Infrastructure can appear healthy while the business workflow is failing.

## Performance Design Rules

1. Define latency as percentiles, not only averages.
2. Distinguish arrival rate from completed throughput.
3. Calculate in-flight concurrency from throughput and latency.
4. Plan for peak traffic, bursts, retries, and one-instance loss.
5. Keep sustained utilization below the saturation cliff.
6. Size thread, connection, and consumer concurrency together.
7. Calculate storage with retention, replication, indexes, and backups.
8. Define availability from correct business responses.
9. Measure queue depth, lag, and oldest-work age.
10. Validate estimates with load, stress, endurance, and failure tests.

## Interview Questions

<ExpandableAnswer title="Why Is Average RPS Not Enough?">

Average RPS hides bursts. A system with 100 average RPS can receive 1,000 RPS
during peak traffic. Design for peak and burst behavior.

</ExpandableAnswer>
<ExpandableAnswer title="Why Use Percentiles Instead Of Average Latency?">

Averages hide tail latency. Users and thread pools suffer when p95/p99 latency
grows, even if average latency looks acceptable.

</ExpandableAnswer>
<ExpandableAnswer title="How Do You Estimate Active Requests?">

Use Little's Law:

```text
active requests = throughput x latency
```

If latency increases while traffic stays constant, active requests increase and
can exhaust threads, memory, queues, and database connections.

</ExpandableAnswer>
<ExpandableAnswer title="What Is The Difference Between Throughput And Capacity?">

Throughput is current completed work per time. Capacity is the maximum safe
throughput the system can handle before latency/errors rise beyond target.

</ExpandableAnswer>

## References

- [Capacity Estimation in Systems Design - GeeksforGeeks](https://www.geeksforgeeks.org/system-design/capacity-estimation-in-systems-design/)

## Official References

- [Google Site Reliability Engineering book](https://sre.google/sre-book/table-of-contents/)
- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- [RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)

## Recommended Next Page

Continue with [End-To-End System Design Method](../system-design-deep-dives/END-TO-END-DESIGN-METHOD.md).

## Recommended Next

Return to [Capacity And Performance Estimation](./CAPACITY-PERFORMANCE-ESTIMATION.md) to select the next focused guide.
