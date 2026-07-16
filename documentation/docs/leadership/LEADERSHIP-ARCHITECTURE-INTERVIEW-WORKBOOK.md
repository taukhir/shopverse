---
title: Leadership And Architecture Interview Workbook
description: Eight complete lead and architect scenarios with model answers, follow-up probes, weak-answer traps, and scoring guidance.
difficulty: Advanced
page_type: Interview Workbook
status: Generic
keywords: [architect interview, leadership interview, microservices, code review, mentoring, production, availability, modernization]
learning_objectives:
  - Answer eight leadership and architecture scenarios through structured reasoning
  - Defend trade-offs under interviewer follow-up and changing constraints
  - Distinguish lead-level execution from architect-level system and organization ownership
technologies: [Spring Boot, Kafka, PostgreSQL, Kubernetes]
last_reviewed: "2026-07-13"
---

# Leadership And Architecture Interview Workbook

<DocLabels items={[
  {label: 'Eight complete scenarios', tone: 'advanced'},
  {label: 'Model answers', tone: 'production'},
  {label: 'Follow-up probes', tone: 'intermediate'},
  {label: 'Self scoring', tone: 'neutral'},
]} />

Attempt each prompt aloud before opening its model answer. A strong response is
structured but conversational: clarify the problem, state a principle, explain the
decision process, address failure and migration, include people and operations,
then close with measurable outcomes.

## Scoring Rubric

| Score | Evidence in the answer |
|---:|---|
| 1 | names technologies or patterns without context |
| 2 | gives a technically plausible implementation |
| 3 | explains alternatives, constraints, and important failure modes |
| 4 | includes incremental delivery, ownership, operations, security, and measurable outcomes |
| 5 | handles data and mixed-version migration, systemic risk, organization design, recovery, cost, and reassessment |

A lead should consistently reach level 4. An architect should reach level 5 for
high-impact decisions without filling every answer with irrelevant technology.

## 1. How Would You Split A Monolith Into Microservices?

### What the interviewer is testing

- whether you challenge solution-first framing;
- domain and service-boundary judgment;
- data ownership and distributed consistency;
- incremental migration and operational readiness;
- team ownership, cost, and measurable value.

### Clarifying questions

- What pain are independent services expected to solve?
- Which modules change, scale, fail, or require compliance differently?
- How are teams and releases organized today?
- Which workflows and database transactions cross proposed boundaries?
- What reliability, latency, deadline, and budget constraints apply?

<ExpandableAnswer title="Model lead and architect answer">

I would not start by drawing services. I would confirm the outcome—such as release
independence, fault isolation, scaling, or regulatory separation—and compare it
with the cost of a modular monolith. I would use domain workshops, code and runtime
dependencies, database relationships, change history, incidents, capacity, and team
ownership to find coherent business capabilities and explicit data authorities.

I would modularize those boundaries in-process first and select an extraction with
clear value, manageable coupling, and useful learning. Using a Strangler seam, I
would route a bounded capability to a new service, preserve contract and schema
compatibility, migrate one source of truth, validate through shadow/canary traffic,
and remove the old path only after reconciliation and the rollback window.

Each service would own its schema and lifecycle. Cross-service workflows would use
explicit synchronous deadlines or durable events as the business contract requires.
For eventual workflows I would define local transactions, outbox, idempotency,
ordering, saga state, compensation, terminal failure, and reconciliation rather
than assuming distributed rollback.

Before multiplying services I would establish CI/CD, identity and secrets, contract
governance, logs/metrics/traces, resilience, health and shutdown, backups/restores,
runbooks, on-call ownership, and cost controls. I would measure deployment
independence, lead time, change failure, recovery, SLOs, operating cost, and legacy
retirement. If those outcomes do not improve, I would stop and revisit the boundary.

</ExpandableAnswer>

### Follow-up probes

- Why not extract Payment first?
- How do you split a shared database without dual-write loss?
- What if the business requires immediate inventory confirmation?
- When would you stop at a modular monolith?
- How do you prevent a distributed monolith?

### Weak-answer traps

- treating entity nouns as automatic services;
- splitting controller, service, and repository layers across the network;
- sharing one database indefinitely while claiming independence;
- proposing a rewrite with no compatibility, data, or retirement plan;
- ignoring platform capacity and on-call ownership.

### Shopverse exercise

Starting from a hypothetical commerce monolith, compare extracting Notification
with extracting Checkout across Order, Inventory, and Payment. Explain why their
data, consistency, and recovery risk differ.

## 2. How Do You Conduct Code Reviews?

### What the interviewer is testing

- engineering quality and risk judgment;
- communication and psychological safety;
- ability to scale standards without becoming a bottleneck;
- security, data, performance, and operational awareness.

### Clarifying questions

- Is this about one review or the team's review operating model?
- What is the product risk and release cadence?
- Which quality checks are automated today?
- Are reviews delayed, inconsistent, or producing escaped defects?

<ExpandableAnswer title="Model lead and architect answer">

I treat review as a correctness, risk, and knowledge-sharing mechanism. The author
provides the problem, scope, design choice, risk, tests, contract or schema impact,
observability, rollout, and recovery. I prefer small coherent changes and author
self-review.

I review the business invariant first, followed by ownership and design, security
and privacy, transaction and data behavior, performance and resilience, testing,
operability, and mixed-version rollout. I classify feedback as blocker, important,
suggestion, question, or nit and explain the impact. For example, I would explain
that a query inside an unbounded loop can exhaust the connection pool rather than
write “bad implementation.”

Formatters, static analysis, tests, dependency and secret scanning enforce
mechanical standards. Complex design disagreement moves to a short conversation
and recurring conclusions become an ADR, standard, or automated rule. I distribute
module ownership and rotate reviewers so the lead is not required for every change.

I evaluate the system through review age, time to first meaningful response,
oversized changes, escaped risk, incident recurrence, and distribution of ownership,
not comment volume. The outcome is safer delivery and broader team judgment.

</ExpandableAnswer>

### Follow-up probes

- What blocks approval versus becoming a follow-up?
- What if delivery is urgent?
- How do you handle a technically correct but overly complex design?
- What if two reviewers disagree?
- How do you review security or data migrations outside your expertise?

### Weak-answer traps

- focusing only on formatting and naming;
- rewriting code in the reviewer's preferred style;
- using title or approval power to end debate;
- personally approving every change;
- approving urgent changes without bounded risk and follow-up ownership.

## 3. How Do You Mentor Senior Developers?

### What the interviewer is testing

- coaching rather than task management;
- delegation, succession, and capability multiplication;
- specific feedback and measurable growth;
- respect for technical and management career paths.

### Clarifying questions

- What direction does the engineer want?
- Which next-level behaviors are missing or inconsistent?
- What real opportunities and safety boundaries are available?
- Is this mentoring, sponsorship, or performance management?

<ExpandableAnswer title="Model lead and architect answer">

I begin with the engineer's chosen direction rather than assuming management. We
assess observable gaps in problem framing, design trade-offs, delivery, production
ownership, stakeholder influence, conflict, and growing others. We connect one
growth goal to a real stretch assignment with clear outcome, decision rights,
constraints, checkpoints, support, escalation threshold, and evidence.

For example, an engineer improving architecture influence might lead a payment
reliability ADR and cross-team review. I coach with questions about invariants,
evidence, alternatives, failure, migration, metrics, and ownership instead of taking
back the solution. I still share safety constraints and organizational context.

Feedback is timely and behavior-based: the situation, observed behavior, impact,
and a specific next experiment. I expand scope deliberately from module ownership
to a service outcome, then a cross-service journey or reusable standard. I create
visibility through design reviews, game days, incident leadership, and stakeholder
communication, and expect senior engineers to mentor others.

Success is not completed courses or dependence on my answers. It is independently
sound judgment, measurable system outcomes, cross-team trust, and new capability
created in the team. If expectations are repeatedly unmet, I separate transparent
performance management from informal mentoring.

</ExpandableAnswer>

### Follow-up probes

- How do you mentor someone more expert than you in a domain?
- What if the senior engineer does not want broader scope?
- How do you delegate without risking production?
- How do you handle a brilliant but dismissive engineer?
- What evidence supports promotion readiness?

### Weak-answer traps

- prescribing courses without real ownership;
- equating promotion with people management;
- delegating tasks but retaining every decision;
- giving vague feedback such as “be more strategic”;
- rescuing the engineer whenever their approach differs.

## 4. How Do You Resolve Disagreements On Architecture?

### What the interviewer is testing

- decision-making and conflict facilitation;
- evidence and trade-off reasoning;
- accountability without authoritarianism;
- durable governance and psychological safety.

### Clarifying questions

- What decision is blocked and who is accountable?
- Is the dispute about an invariant, assumption, preference, or authority?
- How reversible and high-impact is the choice?
- What evidence could change either recommendation?

<ExpandableAnswer title="Model lead and architect answer">

I first write the decision, required outcomes, constraints, invariants, assumptions,
and excluded scope because teams often solve different problems. Before comparing
options, we agree criteria such as business fit, consistency, reliability, security,
performance, operability, delivery, cost, team capability, evolution, and reversal
cost. We include the current design as a baseline.

Each credible alternative explains failure, migration, mixed-version behavior,
operations, and exit. For uncertainty that can change the choice, I use production
evidence or a time-boxed prototype with a hypothesis and success criteria. I match
review depth to blast radius and reversibility: a local library should not wait for
an architecture council, while a public contract or system of record deserves
deeper review.

I invite affected domain, security, data, operations, and delivery voices and make
decision rights explicit. Consensus informs the choice, but an accountable decider
prevents endless debate. I record context, alternatives, consequences, dissent,
validation, and reassessment triggers in an ADR.

After the decision the team commits unless material new evidence appears. I protect
psychological safety and never use “disagree and commit” to silence security,
compliance, or ethical concerns. My role is to improve the decision, not win through
title.

</ExpandableAnswer>

### Follow-up probes

- What if the architect and team strongly disagree?
- When do you escalate?
- How do you decide without enough data?
- Can consensus be harmful?
- When should an ADR be revisited?

### Weak-answer traps

- demanding unanimity;
- using a weighted score as automatic truth;
- endless prototypes with no decision deadline;
- title-based decisions with hidden reasoning;
- reopening a decision repeatedly without new evidence.

## 5. How Do You Improve A Slow Production System?

### What the interviewer is testing

- incident leadership and evidence-led diagnosis;
- performance understanding across application and infrastructure;
- prioritization under customer impact;
- safe correction and recurrence prevention.

### Clarifying questions

- Which user journey and cohort is slow?
- What are p50/p95/p99, throughput, error, saturation, and the SLO?
- When did it begin and what changed?
- Is impact active, intermittent, regional, tenant-specific, or data-dependent?

<ExpandableAnswer title="Model lead and architect answer">

I quantify the affected journey and segment rather than accept “the system is
slow.” During active impact I establish incident roles, preserve a timeline, and
apply the smallest safe mitigation—rollback, feature disablement, load shedding,
background throttling, degraded response, or carefully justified scaling.

I correlate onset with application, schema, configuration, traffic, job,
infrastructure, and dependency changes. Traces locate latency; I then correlate
spans with profiles, thread and heap evidence, GC, executor queues, connection
acquisition, query plans and locks, HTTP client pools and retries, Kafka lag, cache
behavior, and container throttling. I rank hypotheses and collect evidence that
distinguishes them instead of changing several layers by intuition.

I correct the dominant constraint—perhaps an N+1 query, index, transaction scope,
unbounded concurrency, downstream deadline, retry storm, hot key, or algorithm—and
preserve a baseline. I validate with production-shaped data, load/spike/soak and
failure states, then canary with user and resource SLIs plus automatic abort.

Finally I add SLOs and burn-rate alerts, capacity and query/performance regression
checks, runbooks, game days, and owned post-incident actions. I verify correctness,
security, and cost did not regress. More pods are not a fix when they only send more
work to a saturated database.

</ExpandableAnswer>

### Follow-up probes

- What if there is no distributed tracing?
- How do you identify connection-pool exhaustion?
- Why can increasing threads reduce throughput?
- When is caching the wrong answer?
- How do you validate a performance change safely in production?

### Weak-answer traps

- starting with caching or horizontal scaling before evidence;
- reporting average latency only;
- tuning JVM flags before measuring allocation and live set;
- ignoring retry amplification and queue time;
- closing the incident after mitigation without prevention.

## 6. How Do You Design For High Availability?

### What the interviewer is testing

- business-driven reliability targets;
- failure-domain, state, and recovery reasoning;
- resilience and graceful degradation;
- proof through failover, restore, and capacity exercises.

### Clarifying questions

- Which journey requires which availability and latency objective?
- What RTO, RPO, durability, degraded mode, region, and budget apply?
- Which dependencies and data are critical?
- What failure domains must be survived?

<ExpandableAnswer title="Model lead and architect answer">

I start with user-centered availability, correctness, latency and durability SLIs,
then agree SLO, RTO, RPO, degraded behavior, regional requirements, and cost. I
trace each critical journey through DNS, load balancing, gateway, identity, service,
database, broker, cache, configuration, and network to find shared failure domains.

I use stateless replicas, health-based routing, topology spread, capacity headroom,
replicated durable brokers, database standby and promotion with fencing, redundant
configuration and secrets, and tested backups/restores as justified. Replication is
not backup, and multiple application replicas do not help if one database, zone,
credential, or control plane remains critical.

The application expects partial failure through end-to-end deadlines, bounded
idempotent retries with jitter, bulkheads, circuit breakers, admission control,
finite queues, and graceful degradation. State, sessions, scheduled claims, message
acknowledgment, and reconciliation have explicit ownership.

I choose backup/restore, warm standby, active-passive, or active-active regions from
the recovery and consistency contract. Active-active adds conflict resolution,
routing, and cost and is not automatic. I prove the posture with dependency, node,
zone, database, broker, credential, and region exercises plus restore and N-1
capacity tests. Actual user impact, detection, RTO, RPO, data reconciliation, and
error-budget use are the acceptance evidence.

</ExpandableAnswer>

### Follow-up probes

- Why is a backup not high availability?
- What prevents split-brain after database failover?
- When should a dependency affect readiness versus liveness?
- When is active-active unjustified?
- How do retries reduce availability?

### Weak-answer traps

- quoting “four nines” without defining eligible requests;
- assuming Kubernetes makes an application highly available;
- treating replication as backup;
- adding retries without idempotency, budget, or jitter;
- presenting an untested failover diagram as evidence.

## 7. How Do You Handle Zero-Downtime Deployments?

### What the interviewer is testing

- compatibility and deployment strategy;
- safe database and contract evolution;
- health, drain, rollback, and operational automation;
- understanding that data can make binary rollback unsafe.

### Clarifying questions

- What is the service SLO and maximum rollout risk?
- Are schema, API, event, or external side effects changing?
- Can old and new versions coexist?
- Is enough capacity available for surge, green, or canary environments?

<ExpandableAnswer title="Model lead and architect answer">

I begin with the mixed-version invariant: old and new binaries, clients, schemas,
events, cache entries, and workers may coexist. APIs, data, configuration, and
events must therefore be compatible through an explicit transition window.

I select rolling for moderate compatible changes, blue-green for isolated validation
and fast traffic reversal, and canary for high-risk production evidence; they can
be combined. Startup and readiness prevent premature traffic, liveness only signals
unrecoverable process state, and graceful shutdown removes admission before draining
HTTP, Kafka, scheduler, and executor work within a tested bound.

Database changes use expand, transition, backfill and reconcile, then contract in a
later release. APIs and events evolve additively; tolerant consumers deploy before
new production. Feature flags separate deployment from exposure and have owners,
safe defaults, telemetry, and expiry.

Automated stages compare business success, errors, tail latency, saturation,
database and message health, and cohort anomalies against predefined abort criteria.
I choose rollback only when the old binary can understand new data and side effects;
otherwise I fix forward and reconcile or compensate. Cleanup of flags, compatibility
code, and old schema is part of completion.

</ExpandableAnswer>

### Follow-up probes

- How do you rename a database column safely?
- Why might rollback be dangerous after a successful schema migration?
- How do you drain Kafka consumers?
- What if the Actuator port is healthy but the main HTTP port is not?
- How do you choose canary duration and percentage?

### Weak-answer traps

- saying “use Kubernetes rolling update” without compatibility;
- destructive DDL in the same release as application change;
- liveness checks on every external dependency;
- relying only on infrastructure health rather than business SLIs;
- assuming traffic rollback reverses external effects.

## 8. How Do You Migrate A Legacy Application To Spring Boot?

### What the interviewer is testing

- modernization strategy and legacy-risk awareness;
- Spring Boot, data, security, and deployment understanding;
- incremental migration and organizational leadership;
- outcome measurement beyond framework completion.

### Clarifying questions

- Which business and risk outcomes motivate migration?
- What Java, server, framework, data, integration, and security dependencies exist?
- Which behaviors are critical but poorly documented?
- Can capabilities route independently or must modernization occur in place?

<ExpandableAnswer title="Model lead and architect answer">

I treat the work as business and operational modernization rather than annotation
conversion. I inventory critical journeys, versions, modules, database behavior,
batch jobs, integrations, application-server coupling, security, configuration,
deployment, incidents, cost, and team knowledge. I classify capabilities to retain,
refactor, replace, retire, or temporarily rehost.

Before changing behavior I build characterization, contract, integration,
critical-journey, reconciliation, performance, security, and recovery baselines.
I make builds reproducible and establish backups and rollback. The target is the
simplest architecture that meets the outcome—often a modular Boot application before
microservices—and I document every coexistence state.

I upgrade Java and dependencies in supported bounded steps and gradually replace
WAR/application-server, JNDI, server transaction, shared library, XML, container
authentication, and manual configuration assumptions. Legacy integrations sit
behind application ports so adapters can change without contaminating the domain.
I modernize Spring Security, typed configuration and secrets, versioned database
migrations, observability, health and graceful shutdown, CI/CD, packaging, scanning,
and operational ownership.

Depending on coupling I use in-place migration or a Strangler seam. Shadow or
parallel comparison, compatible schemas/contracts, canary traffic, reconciliation,
and explicit rollback or roll-forward protect each wave. I retire old routes, jobs,
tables, servers, access, and licenses using usage evidence. Success is faster and
safer delivery, fewer incidents and unsupported dependencies, tested recovery,
lower toil/cost, and improved maintainability—not merely a Spring Boot startup log.

</ExpandableAnswer>

### Follow-up probes

- When is a rewrite justified?
- How do you test undocumented behavior?
- How do you remove JNDI or server-managed transactions?
- Should you redesign the database during framework migration?
- How do you migrate authentication without privilege regression?

### Weak-answer traps

- replacing XML mechanically without changing risk or operations;
- upgrading Java, framework, database, architecture, and cloud simultaneously;
- assuming existing unit coverage is a sufficient safety net;
- forcing microservices as the target;
- leaving legacy paths running indefinitely without retirement economics.

## Cross-Scenario Rapid Checklist

Before finishing any answer, confirm that you addressed the relevant items:

- business outcome and affected user;
- current evidence and uncertainty;
- invariants, constraints, and alternatives;
- data and security ownership;
- runtime, transaction, thread, and deployment boundaries;
- failure, overload, duplicate, and partial-success behavior;
- incremental migration and mixed-version compatibility;
- rollout, rollback or roll-forward, compensation, and reconciliation;
- observability, SLO, capacity, incident, and recovery;
- team ownership, decision rights, mentoring, and stakeholder communication;
- cost, success metrics, retirement, and reassessment triggers.

## Final Practice Exercise

You inherit Shopverse before a seasonal traffic event. Checkout p99 is rising,
teams dispute whether to rewrite Order, the database has a destructive migration
pending, and one senior engineer owns every deployment review. Prepare a 15-minute
answer that:

1. stabilizes and measures production;
2. decides whether architecture change is justified;
3. creates a safe deployment and data sequence;
4. distributes review and incident ownership;
5. defines availability and recovery evidence;
6. records decisions and success measures.

The best answer connects all eight scenarios into one operating system rather than
treating leadership, architecture, delivery, and production as separate concerns.

## Recommended Deep Dives

- [Monolith To Microservices Strategy](./MONOLITH-TO-MICROSERVICES-STRATEGY.md)
- [Engineering Leadership Practices](./ENGINEERING-LEADERSHIP-PRACTICES.md)
- [Architecture Decisions And Disagreements](./ARCHITECTURE-DECISIONS-AND-DISAGREEMENTS.md)
- [Production Performance And Availability](./PRODUCTION-PERFORMANCE-AND-AVAILABILITY.md)
- [Zero-Downtime Delivery](./ZERO-DOWNTIME-DELIVERY.md)
- [Legacy To Spring Boot Modernization](./LEGACY-TO-SPRING-BOOT-MODERNIZATION.md)

## Official References

- [Google Engineering Practices](https://google.github.io/eng-practices/)
- [Google SRE: Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- [Spring Boot reference](https://docs.spring.io/spring-boot/reference/)
- [Kubernetes documentation](https://kubernetes.io/docs/)
