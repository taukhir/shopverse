---
title: AWS RDS And DynamoDB
---

# AWS RDS And DynamoDB

## RDS Advantages

Amazon RDS manages relational database provisioning, engine patching,
monitoring integration, automated backups, and common high-availability
operations. It reduces undifferentiated host work while retaining SQL,
transactions, indexes, and engine compatibility.

It does not remove the need for schema design, query/index tuning, connection
pooling, least privilege, capacity planning, backup retention, and restore tests.

## RDS Availability And Scaling

- **Multi-AZ** improves availability through a standby or multi-instance topology; it is not primarily a read-scaling feature.
- **Read replicas** scale eligible reads and can support reporting or regional strategies, but replication lag must be acceptable.
- **Vertical scaling** changes instance capacity and may cause disruption depending on topology and operation.
- **Storage scaling** adds capacity; confirm engine and storage constraints before emergencies.
- **RDS Proxy** can pool and protect database connections for bursty applications such as Lambda.
- Application caching and query/index improvements should precede blind capacity increases.

## RDS Alerts And Important Factors

Alarm on CPU, free memory, free storage, connections, read/write latency and
IOPS, queue depth, replica lag, failed backups, and failover events. Use Database
Insights/Performance Insights and slow-query facilities to locate database load,
not just host saturation. Also review maintenance windows, parameter groups,
deletion protection, encryption, secret rotation, audit needs, and recovery
objectives. Keep databases in private subnets and restrict their security groups.

## DynamoDB

DynamoDB is a managed key-value and document database designed around explicit
access patterns and partition keys. It offers on-demand or provisioned capacity,
secondary indexes, conditional writes, transactions, TTL, streams, point-in-time
recovery, global tables, and optional caching through DAX.

Start from the queries the application must answer. Choose a partition key that
distributes traffic and a sort key that groups related data. A key with very few
popular values can create hot partitions. Secondary indexes improve new access
paths but add storage, write cost, and consistency considerations.

Monitor consumed capacity, throttled requests, latency, system errors, hot-key
signals, index behavior, and replication latency where relevant. Use conditional
writes for idempotency and optimistic concurrency. DynamoDB is not automatically
the right choice when an application depends on ad-hoc joins and relational
constraints.

## RDS Or DynamoDB?

| Choose RDS when | Choose DynamoDB when |
|---|---|
| Relationships, joins, and flexible SQL are central | Key-based access patterns are known and stable |
| Multi-row relational transactions dominate | Very high elastic throughput and low operational overhead matter |
| Existing relational tools and skills are important | Event-driven integration through Streams is useful |
| The model changes through normalized schemas | Denormalization and application-managed relationships are acceptable |
