---
title: AWS CloudWatch Monitoring
status: "maintained"
last_reviewed: "2026-07-13"
---

# AWS CloudWatch Monitoring

CloudWatch collects service and custom metrics, logs, alarms, dashboards, and
related operational signals. A dashboard visualizes state; an alarm evaluates a
metric or expression and can notify or automate action. Neither replaces an
incident owner, runbook, or tested recovery procedure.

## Monitoring Model

1. Define user-facing service-level indicators: availability, latency, errors, and correctness.
2. Add dependency and resource signals that explain those outcomes.
3. Create alarms only when someone or automation can take a useful action.
4. Link alarms to dashboards, logs, traces, ownership, and a runbook.
5. Test missing-data, low-traffic, deployment, and recovery behavior.

Use dimensions carefully because every unique combination can create another
time series and cost. Choose statistic, period, evaluation window, and missing-
data treatment to match the failure. Percentiles usually explain tail latency
better than averages.

## Service Signal Matrix

| Service | Start with | Typical alarm intent |
|---|---|---|
| EC2 | CPU, status checks, network; agent metrics for memory/disk | Failed host, saturation, or loss of serving capacity |
| EBS | Operations, bytes, latency/queueing, status, burst balance where applicable | Storage impairment or sustained I/O bottleneck |
| RDS | CPU, memory, storage, connections, latency/IOPS, replica lag | Exhaustion, query pressure, replication or availability risk |
| S3 | Request/error and storage metrics when enabled, replication and access findings | Elevated failures, replication delay, unexpected growth or exposure |
| Lambda | Invocations, errors, duration, throttles, concurrency, iterator age | Failed processing, latency regression, throttling or backlog |
| DynamoDB | Consumed capacity, throttles, latency, errors, replication | Hot keys/capacity pressure, failures, regional lag |
| API Gateway | Count, latency, integration latency, 4xx/5xx | Client/API contract spike or backend failure |
| Load balancer | Healthy hosts, request count, response time, target/LB errors | No healthy capacity or elevated user-facing failures |
| SQS | Oldest message age, visible/in-flight messages, DLQ depth | Backlog growing or poison messages |
| EventBridge/SNS | Failed invocations/deliveries and throttling | Events cannot reach targets |

Some detailed metrics require enabling a feature, installing the CloudWatch
agent, or accepting additional cost. Confirm collection before relying on an
alarm.

## Dashboards

Build small role-based dashboards rather than one wall of every metric:

- **Service overview:** traffic, errors, latency, saturation, recent deployments.
- **Compute:** desired/in-service capacity, unhealthy hosts, CPU/memory, scaling events.
- **Data:** RDS connections/storage/latency and DynamoDB throttle/latency signals.
- **Event processing:** queue age/depth, Lambda errors/throttles, DLQ messages.
- **Storage:** EBS performance and S3 request, replication, or growth indicators.
- **Cost and quotas:** spend anomaly, major usage drivers, and capacity limits.

## Logs And Alarms

Use structured logs with request, trace, tenant where allowed, event, and
resource identifiers. Define retention and protect sensitive data. Logs Insights
supports investigation, while metric filters or embedded metrics can turn
selected log observations into alarms. Avoid high-cardinality identifiers as
metric dimensions.

Send alarms through SNS or an incident integration, suppress duplicates through
composite alarms where helpful, and distinguish symptom alarms from diagnostic
alarms. Every paging alarm should state impact, owner, first checks, safe
mitigation, escalation, and how to verify recovery.
