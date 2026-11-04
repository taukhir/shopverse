# Discussion 06 — EOM (Enterprise Order Model) Design Finalization

**Attendees:** Senior Developer (convened), Elena Vasquez (Architect,
synthesizing). Cross-referenced (not summoned — see note below): Codex,
the team's Product Manager, working in a separate session under
`Team/product-manager/`.

**Format note:** this meeting used real external reference material
(`D:\BE Projects\checkout\checkout\commerce-checkout-api\source\checkout-eom-rest\v1\openapi-rest.yml`
— the actual Amway EOM/SalesOrder contract) plus a second AI teammate's
independently-produced engineering plan, rather than discussion alone.

## A note on Codex

`AGENTS.md` was updated (outside this session) to name Codex as the
team's Product Manager, working in a parallel session. `Team/product-manager/`
already contained real analysis: `contract-rollout-plan.md` inspects
`ShopverseOutboxPublishWorker` (uses `KafkaTemplate<String, String>`,
publishes `message.payload()` — Avro needs an explicit publishing
boundary change) and `OrderSagaListener` (parses `String` payloads via
`KafkaEventParser`, including retry-topic and DLT paths — migration
must cover these, not just the main listener).

Per the same ownership principle Diego has respected toward discussion-03,
**this session read Codex's files but did not write to them** — that
folder is Codex's own memory to maintain. Findings are cross-referenced
here and in `Team/tauqeer/task/order-contract-design/`, in both
directions.

## What happened

1. **Read the real EOM contract.** The actual `SalesOrder` envelope
   (`id`, `countryIsoCode`, `eventInfo`, `entity`, `orderEventStatus` +
   `orderEventStatusReason`, `isBinary`, `retry`) and `OrderLine` (8-state
   quantity tracking: ordered/allocated/unallocated/pending/shipped/
   cancelled/backordered/returned; per-line `fulfillmentType`; per-line
   dates). Also `Entity` — Amway's order header, ~90 fields, heavily
   MLM-specific (PV/BV amounts, ABO profit, subscription/bonus period,
   commission flags).

2. **Decided what to borrow and what to reject, explicitly.** Borrowed:
   `statusReason` on the order, a scoped-down `reservedQuantity` (not all
   8 quantity states) and `fulfillmentType` per line item. Rejected:
   every PV/BV/ABO/commission/subscription field — correctly out of
   scope, this is Amway's business model, not a generic enterprise
   pattern.

3. **Found and fixed an overclaim** in the existing Avro draft: `eventId`
   alone doesn't implement deduplication, per Codex's independent
   review — it's the identity a consumer-side inbox needs, not the
   inbox itself. Corrected in `order-created-event.avsc`.

4. **Resolved a real tension Codex flagged**, not papered over: the
   repo's `AGENTS.md` keeps event records copied per-service, which
   seemed to conflict with sharing one `shopverse-avro-schemas` module.
   Resolution: the module shares the `.avsc` schema *definition* only
   (an IDL-like source of truth); each service still generates and
   compiles its own independent Java class from it at build time — no
   shared compiled code or runtime dependency, preserving the existing
   convention.

5. **Confirmed Codex's rollout-plan sequence is the execution plan**,
   not something to re-derive: inventory current behavior → formalize
   OpenAPI + create `shopverse-contracts` → create `shopverse-avro-schemas`
   → select/pin a schema registry (proposed: Confluent-compatible,
   `BACKWARD_TRANSITIVE`) → pilot one event route + one REST operation →
   controlled new-topic cutover (not a dual-path risk) → CI compatibility
   checks + real registry integration tests. This also independently
   validates Diego's two-phase-rollout finding from discussion-04 — two
   AI teammates reasoning separately arrived at compatible answers.

## Outcome

Design finalized at the draft level — see the updated files in
`Team/tauqeer/task/order-contract-design/`. Still not implemented, and
still waiting on the same open question raised in discussion-05: is
BUG-001's option (a) scheduled before or after Nov 12?

## Open items carried forward

1. BUG-001 option (a) scheduling — still unanswered.
2. Formal plan-mode entry before any real Gradle module is created.
3. Codex's rollout plan treats "inventory current behavior" as its own
   first deliverable — worth confirming who does that inventory (Codex,
   Diego, or jointly) before duplicating effort.
