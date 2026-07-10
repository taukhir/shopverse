---
title: Backend Engineering Glossary
page_type: Reference
difficulty: Beginner
status: Generic
last_reviewed: "2026-07-10"
---

# Backend Engineering Glossary

Technical guides automatically link the first relevant occurrence of these
terms to this page.

## Idempotency {#idempotency}

The property that repeating an operation with the same identity produces the
same externally observable result instead of duplicating its business effect.

## Transactional Outbox {#transactional-outbox}

A pattern that stores a business change and an event record in the same local
database transaction, then publishes the event asynchronously.

## SAGA {#saga}

A distributed business transaction represented as coordinated local
transactions with explicit failure and compensation behavior.

## JWKS {#jwks}

JSON Web Key Set: a published collection of public keys used by resource
servers to verify signed JWTs.

## Fencing Token {#fencing-token}

A monotonically increasing token that lets a resource reject writes from an
older lock holder after its lease has expired.

## Consumer Group {#consumer-group}

A Kafka coordination unit in which partitions are assigned among consumers so
each partition is actively processed by one group member at a time.

## Distributed Lock {#distributed-lock}

A coordination mechanism that grants time-bounded ownership across processes.
Correct designs account for lease expiry, pauses, and stale owners.

## Correlation ID {#correlation-id}

An identifier propagated across requests, events, logs, and traces to connect
work belonging to the same business or technical operation.
