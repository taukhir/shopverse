---
title: RAG For Engineering Documentation And Developer Support
description: Design grounded retrieval over architecture documents, ADRs, runbooks, APIs, incidents, and code metadata with access control, citations, freshness, and evaluation.
sidebar_label: Engineering Documentation RAG
difficulty: Advanced
page_type: Reference
status: maintained
prerequisites: [Embeddings and vector search, AI security, Evaluation fundamentals]
technologies: [RAG, Embeddings, Vector Database, Hybrid Search, Reranking, Spring AI]
last_reviewed: "2026-07-29"
scope: generic
owner: docs-ai
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# RAG For Engineering Documentation And Developer Support

Retrieval-augmented generation supplies relevant source material at answer time.
For engineering teams, useful sources include ADRs, API contracts, runbooks,
service ownership, deployment guides, incident reviews, schemas, and selected
code metadata. RAG improves grounding; it does not make stale or unauthorized
content trustworthy.

## Target Questions

Design around real questions:

- Which service owns inventory reservation state?
- How is checkout compensated after payment failure?
- Which runbook covers Kafka consumer lag?
- Is an event field backward compatible?
- What tests and dashboards verify outbox publication?
- Which ADR explains the choreography decision?

Do not index everything merely because it is available.

## Reference Architecture

```text
Sources -> parse -> classify -> chunk -> enrich -> embed/index
                                              |
Question -> authorize -> hybrid retrieve -> rerank -> context assembly
                                              |
                                      answer with citations
                                              |
                                      feedback and evaluation
```

Authorization must happen before content reaches the model and again when
results are assembled. Never rely on the model to hide unauthorized passages.

## Source Contract

Store metadata with every chunk:

| Field | Purpose |
|---|---|
| stable source ID and URL/path | citation and deduplication |
| title and section hierarchy | readable context |
| repository and revision | reproducibility |
| service/domain tags | filtered retrieval |
| document type | prefer ADR, contract, runbook, or incident appropriately |
| owner and reviewed date | freshness and escalation |
| ACL/classification | authorization |
| valid-from/superseded-by | temporal correctness |

## Chunking Strategy

Chunk by semantic structure, not arbitrary character count. Preserve headings,
code blocks, tables, decision status, and links. Keep an ADR decision with its
context and consequences; keep a runbook step with its prerequisites and safety
warning. Include limited parent context in metadata rather than duplicating the
whole document in every chunk.

For code, retrieve symbols, signatures, comments, module ownership, and nearby
tests. A code-aware index supplements direct repository inspection; it should
not replace reading the current source before editing.

## Retrieval Pipeline

1. classify the question by domain, time, and source type;
2. apply tenant, repository, and document ACL filters;
3. combine keyword and semantic retrieval;
4. expand exact identifiers such as event names and error codes;
5. rerank candidates for the question;
6. diversify results to avoid five near-duplicate chunks;
7. assemble within a token budget;
8. require source-linked answers and explicit uncertainty.

Keyword search is strong for `PaymentRequested`, error codes, paths, and IDs.
Semantic search helps with concepts such as “duplicate consumer processing.” A
hybrid approach normally serves engineering language better.

## Answer Contract

```text
Answer only from authorized retrieved evidence and clearly labeled repository
inspection. Cite each material claim. If sources conflict, show the conflict and
prefer the current authoritative contract or reviewed document. If evidence is
insufficient, say what is missing; do not complete the answer from memory.
```

Include freshness and revision in the UI. A precise answer from an obsolete ADR
can be more dangerous than an explicit “not enough evidence.”

## Security And Prompt Injection

Indexed content is untrusted. Strip active markup, isolate retrieved passages,
and tell the model they are evidence rather than instructions. Enforce ACLs in
retrieval code. Log source IDs rather than sensitive content where possible.
Protect feedback and ingestion endpoints against poisoning.

## Evaluation Set

Create questions with expected source IDs, required claims, forbidden claims,
and an abstention expectation. Measure:

- retrieval recall at K;
- ranking quality;
- citation precision and completeness;
- grounded claim rate;
- correct abstention;
- ACL leakage rate;
- freshness and supersession handling;
- answer latency and cost.

Evaluate retrieval separately from generation. If the correct ADR never reaches
the context, prompt changes cannot fix the retrieval failure reliably.

## ShopVerse Pilot

Start with a curated, public-to-the-team collection:

- retail architecture and checkout ADRs;
- saga, outbox, inbox, retries, and recovery documentation;
- service API contracts and database ownership;
- observability and demo runbooks;
- reviewed incident examples with sensitive data removed.

Pilot questions should cover successful checkout, duplicate delivery, inventory
failure, payment compensation, event ordering, and correlation tracing. Add
private issue or incident connectors only after identity and ACL behavior pass.

## Operational Lifecycle

Re-index on reviewed document changes, mark deleted and superseded content, and
monitor ingestion failures. Provide a “report stale answer” action that captures
question and source IDs without leaking the entire conversation.

Use query analytics to improve missing documentation, not to silently broaden
data access. High unanswered volume may reveal a documentation ownership gap.

## Production Checklist

- [ ] target questions and owners are defined;
- [ ] source quality, classification, and freshness are visible;
- [ ] authorization is deterministic and tested;
- [ ] chunking preserves engineering meaning;
- [ ] hybrid retrieval handles identifiers and concepts;
- [ ] citations resolve to exact source sections;
- [ ] conflicting and insufficient evidence produces safe behavior;
- [ ] prompt injection and ingestion poisoning are tested;
- [ ] retrieval and generation have separate evals;
- [ ] deletion, supersession, and audit workflows operate correctly.

Continue with [Advanced Agentic Workflows And Worktrees](./ADVANCED-AGENTIC-WORKFLOWS-WORKTREES.md).

## Official References

- [OpenAI Retrieval guide](https://platform.openai.com/docs/guides/retrieval)
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
