---
title: Java Core, Collections, Threads And Streams Interview Workbook
description: Senior and architect questions for overloading, overriding, hiding, collections, scheduling, ForkJoinPool and stream internals.
---

# Java Core, Collections, Threads And Streams Interview Workbook

## Overloading

1. **Why does widening beat boxing?** Strict invocation applicability is evaluated before loose invocation.
2. **What does `call(null)` select?** The most-specific compatible reference type; unrelated candidates are ambiguous.
3. **Does runtime type select an overload?** No; declared types select it at compilation.
4. **Can return type distinguish overloads?** No.
5. **Why can adding an overload change behavior only after recompilation?** Old bytecode retains its descriptor; source resolution runs again.

Architect follow-up: design overloads for a public lambda-heavy API without null,
boxing or unrelated-SAM ambiguity.

## Overriding And Hiding

1. **Can an override broaden a checked exception?** No.
2. **Why does a parent-typed reference call a child instance method?** Runtime virtual dispatch.
3. **Why does the same reference call the parent static method?** Static hiding is compile-time.
4. **Are fields polymorphic?** No.
5. **Why is a bridge method emitted?** To preserve generic overriding after erasure.

Predict: a base constructor calling a child override reads child fields before
initialization and therefore sees defaults.

## Collections And Comparison

1. **Why can only overriding `equals` break map lookup?** Equal objects can produce different bucket hashes.
2. **Why is a mutable key dangerous?** Its bucket position no longer corresponds to its new hash.
3. **Does `TreeSet` use `equals` for uniqueness?** It uses comparator/natural comparison zero.
4. **Why can `ArrayList` outperform `LinkedList` for insertion workloads?** Locality, traversal and optimized copies dominate theoretical node insertion.
5. **Is an unmodifiable view immutable?** No; backing aliases can mutate it.

Architect scenario: choose a collection for a million-entry read-mostly index with
range queries, then explain memory, update and concurrency trade-offs.

## Thread Scheduling And Pools

1. **Does RUNNABLE mean executing?** It includes ready/running native states.
2. **Can priority guarantee fairness?** No.
3. **Why can more threads reduce CPU throughput?** Context switches and cache/TLB disruption.
4. **Why does an unbounded pool queue neutralize maximum size?** Tasks enqueue before growth beyond core.
5. **Does virtual-thread concurrency imply database parallelism?** No; connection and database limits remain.

Debug scenario: low CPU, rising latency and thousands of waiting tasks indicate
queue/dependency pressure, not insufficient scheduler priority.

## ForkJoinPool

1. **Why local LIFO?** It improves locality for recently forked subtasks.
2. **Why steal from the opposite end?** Thieves obtain older, larger work and reduce contention.
3. **Why fork one branch and compute one?** It avoids unnecessary scheduling and keeps the worker productive.
4. **What is managed blocking?** A protocol allowing possible compensation for unavoidable worker blocking.
5. **Why can parallel streams and futures interfere?** They may share the common pool.

Compile/design question: a recursive task threshold of one is correct but often
catastrophically inefficient due to task allocation and scheduling.

## Streams And Parallel Streams

1. **When does a pipeline execute?** A terminal operation drives traversal.
2. **Are intermediate collections created after each operation?** Normally no; sink stages are fused.
3. **Why is subtraction an invalid parallel reduction?** It is non-associative.
4. **Why can ordered `findFirst` be slower than `findAny`?** It coordinates encounter order.
5. **Why is shared `ArrayList::add` unsafe?** Parallel side effects race and violate reduction ownership.

Architect scenario: reject parallel HTTP calls inside `parallelStream`; explain
common-pool blocking, absent deadlines/bulkheads and why structured virtual-thread
tasks or an owned executor provide clearer lifecycle and capacity.

## Scoring Rubric

- **Junior:** correct definition.
- **Senior:** rule, mechanism, output and failure boundary.
- **Lead:** production trade-off, diagnostic evidence and safer alternative.
- **Architect:** capacity, compatibility, lifecycle, rollout and rollback.

## Official References

- [Java Language Specification](https://docs.oracle.com/javase/specs/jls/se25/html/index.html)
- [`java.util`](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/package-summary.html)
- [`java.util.concurrent`](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/package-summary.html)
- [Stream package](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/stream/package-summary.html)

## Recommended Next

Run [Executable Labs](./JAVA-EXECUTABLE-LABS.md) before using these as interview answers.
