---
title: "Latency, Throughput, And Saturation Models"
description: "Latency, Throughput, And Saturation Models with Shopverse examples, failure analysis, and production guidance."
sidebar_label: "Latency, Throughput, And Saturation Models"
tags: ["shopverse", "architecture", "production"]
page_type: "Guide"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# Latency, Throughput, And Saturation Models

<DocLabels items={[{label: 'Advanced', tone: 'advanced'}, {label: 'Shopverse', tone: 'shopverse'}, {label: 'Production', tone: 'production'}]} />

## Latency

Latency is the elapsed time required to complete an operation:

```text
latency = response completion time - request arrival time
```

Example:

```text
request arrived:  10:00:00.100
response returned: 10:00:00.350
latency:                    250 ms
```

Report distributions rather than only averages:

| Metric | Meaning |
|---|---|
| p50 | 50% of requests completed at or below this time |
| p90 | 90% completed at or below this time |
| p95 | 95% completed at or below this time |
| p99 | 99% completed at or below this time |
| maximum | slowest observed request in the measurement window |

Example:

```text
p50 = 80 ms
p95 = 300 ms
p99 = 900 ms
```

The average could be `110 ms` while a significant tail still takes nearly one
second. User experience, deadlines, thread occupancy, and cascading failures
are often determined by tail latency.

Break end-to-end latency into components:

```text
total latency =
    gateway time
  + application processing
  + database time
  + downstream service time
  + queueing time
  + network time
  + serialization time
```

Parallel calls do not add in the same way as sequential calls. The critical
path is approximately the slowest parallel branch plus common work.

## Throughput

Throughput is the amount of completed work per unit of time:

```text
throughput = completed requests / measurement duration
```

Example:

```text
60,000 successful requests in 5 minutes

60,000 / 300 seconds = 200 requests/second
```

Common units:

- requests per second (RPS);
- transactions per second (TPS);
- Kafka records per second;
- database queries or rows per second;
- bytes per second;
- jobs per minute.

Define whether throughput counts attempted, successful, or completed requests.
For capacity planning, use peak throughput and burst behavior, not only the
daily average.

```text
average RPS =
    daily requests / 86,400
```

If 8.64 million requests arrive per day:

```text
8,640,000 / 86,400 = 100 average RPS
```

Traffic may peak at five or ten times that average.

## Active Requests And Concurrency

Active requests are requests accepted but not yet completed. They consume
threads or event-loop work, memory, connections, and downstream capacity.

For a stable system, Little's Law gives an estimate:

```text
average concurrency =
    average throughput x average response time
```

Keep units consistent:

```text
throughput = 500 requests/second
average latency = 0.200 seconds

average active requests = 500 x 0.200 = 100
```

If p95 latency rises to two seconds during a dependency slowdown:

```text
500 x 2 = 1,000 active requests
```

The same arrival rate now requires roughly ten times as many in-flight request
slots. This explains how latency increases can exhaust servlet threads,
database connections, memory, and queues even when traffic is unchanged.

Little's Law describes long-term averages in a stable system. It does not
replace direct metrics for instantaneous active requests, bursts, retries, or
uneven workloads.

Measure active HTTP requests with a gauge or derive them from:

```text
active = requests started - requests completed
```

The value must be decremented in a `finally` block so exceptions and
cancellations do not leak the count.

## Arrival Rate And Service Rate

```text
arrival rate (lambda) = incoming work per second
service rate (mu) = work one worker can complete per second
```

Approximate one worker's service rate:

```text
service rate = 1 / average service time
```

If one sequential worker takes `50 ms`:

```text
1 / 0.050 = 20 requests/second
```

Theoretical workers for `500 RPS`:

```text
500 / 20 = 25 workers
```

This is only a starting estimate. Add headroom for variance, garbage
collection, downstream waits, retries, maintenance, and instance failure.

When arrival rate approaches total service capacity, queueing latency can grow
sharply. Do not design steady-state utilization at 100%.

## Utilization And Saturation

Utilization describes the fraction of a resource currently busy:

```text
utilization = busy capacity / total capacity
```

Examples:

```text
CPU utilization = CPU busy time / available CPU time
connection utilization = active connections / maximum pool size
thread utilization = busy request threads / maximum request threads
```

Saturation means demand is waiting because capacity is exhausted or nearly
exhausted. Useful saturation indicators:

- request queue length;
- database connection pending count;
- servlet thread pool active/max;
- executor queue depth;
- Kafka consumer lag;
- CPU run queue;
- disk I/O wait;
- memory pressure and garbage-collection pauses.

High utilization is not automatically bad. Sustained high utilization plus
growing queues, latency, or errors indicates insufficient capacity or a
bottleneck.

## Error Rate

```text
error rate =
    failed requests / total requests
```

Example:

```text
500 failures / 100,000 requests = 0.5% error rate
```

Separate:

- client errors such as validation and authorization failures;
- server errors;
- dependency timeouts;
- throttled requests;
- business declines such as insufficient stock or declined payment.

A payment decline can be a successful technical response and should not be
counted as a platform failure.

## Recommended Next

Return to [Performance And Capacity Models](./PERFORMANCE-CAPACITY-MODELS.md) to select the next focused guide.


## Official References

- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)
