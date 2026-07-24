---
title: Spring Data Redis In Depth
description: RedisTemplate, repositories, serialization, TTL, caching, locking, Pub/Sub, Streams, clustering, testing, and production incidents.
difficulty: Advanced
page_type: Deep Dive
status: Generic
prerequisites: [Redis fundamentals, Spring Data Commons]
learning_objectives: [Select Redis access APIs, Design key TTL and serialization contracts, Diagnose memory latency and cluster failures]
technologies: [Spring Data Redis, Redis, Spring Boot]
last_reviewed: "2026-07-24"
---

# Spring Data Redis In Depth

Redis can be a cache, transient coordination store, counter service, stream, or specialized
primary store. State which role it plays before choosing durability, eviction, consistency,
and outage behavior.

## Access APIs

| API | Best fit |
|---|---|
| `RedisTemplate` | typed imperative commands, transactions, pipelining and scripts |
| `ReactiveRedisTemplate` | end-to-end reactive command flow |
| repositories | simple hash-backed aggregates with indexed fields |
| Spring Cache | method-result caching with provider-neutral annotations |
| direct connection/script | atomic custom operation not represented by a higher API |

Repositories are not a universal Redis abstraction. They do not replace explicit modelling
for counters, sorted sets, streams, geospatial indexes, probabilistic structures, or scripts.

## Serialization Contract

Never rely on unsafe native Java serialization. Configure key, hash-key, value, and hash-value
serializers explicitly. Version values and support a rolling migration where old and new
application instances overlap.

```java
@Bean
RedisTemplate<String, OrderCacheValue> orderRedisTemplate(
        RedisConnectionFactory factory, ObjectMapper mapper) {
    RedisTemplate<String, OrderCacheValue> template = new RedisTemplate<>();
    template.setConnectionFactory(factory);
    template.setKeySerializer(new StringRedisSerializer());
    template.setValueSerializer(new GenericJackson2JsonRedisSerializer(mapper));
    return template;
}
```

Do not store secrets or unrestricted polymorphic types in cached payloads.

## Keys And TTL

Use namespaced, versioned, bounded keys such as `shopverse:v2:order:{id}`. Define ownership,
maximum cardinality, value size, TTL, invalidation, and deletion behavior for every family.
Add TTL jitter to reduce synchronized expiration.

Cache-aside flow:

1. Read cache.
2. On miss, read authority.
3. Populate with bounded TTL.
4. On mutation, commit authority and invalidate/update after the correct boundary.

Never claim database and Redis writes are atomic. Design stale-read tolerance and repair.

## Atomic Operations And Lua

Use atomic commands or a Lua script for compare-and-update logic involving multiple keys.
Scripts block the Redis execution thread while running, so keep them bounded and deterministic.
In Cluster, multi-key operations require keys in the same hash slot using a reviewed hash tag.

## Transactions, Pipelining, And Locking

- `MULTI/EXEC` queues commands; it does not provide relational rollback semantics.
- Pipelining reduces round trips but does not make commands atomic.
- Distributed locks need unique ownership tokens, bounded leases, safe release, and fencing
  when stale owners can damage an external resource.
- Prefer database constraints or broker partition ownership when they directly protect the
  invariant.

## Pub/Sub And Streams

Pub/Sub is ephemeral: disconnected subscribers miss messages. Redis Streams retain entries
and support consumer groups, pending entries, acknowledgements, claiming, and trimming.
For durable event backbones, compare operational and replay needs with Kafka explicitly.

## Topology And Failure

Standalone, Sentinel, and Cluster have different availability and routing behavior. Clients
must handle topology refresh, redirects, failover, authentication rotation, and timeouts.
Replication is asynchronous; acknowledged writes can be lost in some failover windows.

Monitor memory, fragmentation, evictions, expired keys, command latency, hot keys, blocked
clients, connections, replication lag, persistence duration, cluster slots, stream pending
entries, and cache hit ratio by key family.

## Production Scenarios

- Hit ratio falls: separate compulsory misses from expiry, eviction, bad keys, and invalidation.
- Memory reaches limit: identify key families and value growth before changing eviction.
- One CPU saturated: inspect hot keys, expensive commands, scripts, and large collections.
- Cache outage: apply bounded fallback; prevent a database stampede with concurrency control.
- Stale permissions: shorten TTL and use explicit invalidation for security-critical state.

## Interview Questions

1. How does `RedisTemplate` differ from Spring Cache?
2. Why is pipelining not atomic?
3. What can fail during Sentinel promotion?
4. Why does a safe distributed lock sometimes require fencing?
5. When should Redis Streams not replace Kafka?

## Official References

- [Spring Data Redis reference](https://docs.spring.io/spring-data/redis/reference/)
- [Redis documentation](https://redis.io/docs/latest/)

## Recommended Next

Review [Spring Cache](../SPRING-CACHE.md) and [Testing And Operations](./SPRING-DATA-TESTING-OPERATIONS.md).

