---
title: Advanced AI Topics
sidebar_position: 6.6
---

# Advanced AI Topics

Learn these after you understand basic chat, embeddings, vector search, RAG, and
tool calling.

## Component Map

![Java AI component map](/img/diagrams/ai-component-map.svg)

## Hybrid Search

Hybrid search combines:

- keyword search
- vector search

Why it matters:

| Case | Why vector alone may fail |
|---|---|
| SKU search | exact ID must match |
| order number | semantic meaning is irrelevant |
| product model number | exact token matters |
| policy phrase | keyword plus semantic both help |

Interview answer:

> I would use vector search for semantic questions and hybrid search when exact
> identifiers like SKU, order ID, or model number matter.

## Reranking

Reranking means retrieving more chunks first, then using another model or scorer
to reorder them.

Flow:

```text
question -> retrieve top 20 -> rerank -> keep top 5 -> LLM answer
```

Use it when:

- retrieval returns too much noise
- documents are similar
- answer quality depends on the best few chunks

## Query Rewriting

Sometimes the user question is vague:

```text
What about that?
```

Query rewriting uses chat history or context to produce a better search query:

```text
Can defective products be returned after delivery?
```

Be careful:

- rewritten query should not change user intent
- keep original question for final answer
- log rewritten query only if safe

## Contextual Compression

Retrieved chunks can be long. Contextual compression extracts only the useful
parts before sending to the LLM.

Before:

```text
Full two-page policy chunk
```

After:

```text
Defective products can be returned within 7 days after delivery.
```

Benefit:

- lower token cost
- less irrelevant context
- better answer focus

## Multi-Tenant And Authorization-Aware RAG

Never retrieve data the user should not see.

Bad:

```text
vectorStore.search(question)
```

Better:

```text
vectorStore.search(question, filters: userRole=PUBLIC, tenantId=currentTenant)
```

Shopverse examples:

| Data | Access rule |
|---|---|
| public FAQ | everyone |
| admin runbook | admin only |
| user order | owner only |
| internal payment error | support/admin only |

## Evaluation

![AI evaluation lifecycle](/img/diagrams/ai-evaluation-lifecycle.svg)

Evaluation checks whether the AI system works consistently.

Create a small test set:

| Question | Expected source | Expected behavior |
|---|---|---|
| Can I return defective product? | return-policy.md | answer with 7-day policy |
| How long is shipping? | shipping-policy.md | answer with delivery timeline |
| What is my password? | none | safe fallback |
| Suggest laptop under 50000 | inventory API | real products only |

Evaluate:

- retrieval correctness
- answer correctness
- citation correctness
- fallback correctness
- latency
- cost

## Guardrails

Guardrails are controls around the model.

For a detailed security guide, read [AI Security And Guardrails](AI-SECURITY-GUARDRAILS.md).

| Guardrail | Example |
|---|---|
| input validation | max message length |
| output validation | JSON schema validation |
| retrieval filter | public docs only |
| tool allowlist | read-only tools |
| authorization check | order owner only |
| prompt rule | answer only from context |
| fallback | say answer not found |

Important:

```text
Guardrails are not only prompts. Real guardrails are backend checks.
```

## Agents

Agents are systems where the model can plan and take multiple steps using
tools.

Simple tool call:

```text
User -> model chooses one tool -> Java executes -> answer
```

Agentic flow:

```text
User -> model plans -> tool 1 -> observe -> tool 2 -> observe -> final answer
```

For your current interview goal, agents are secondary. Master RAG and tool
calling first.

## Caching

Cache carefully.

Can cache:

- embeddings for unchanged documents
- retrieved chunks for repeated public questions
- model responses for static FAQ answers

Avoid caching:

- user-specific order answers
- sensitive data
- stale product price/stock answers

## Cost Control

| Cost driver | Control |
|---|---|
| long prompts | chunk and filter context |
| too many chunks | tune top-k |
| long answers | max tokens |
| repeated questions | cache safe responses |
| expensive model | use smaller model for classification |
| high traffic | rate limit AI endpoints |

## Latency Control

| Source | Mitigation |
|---|---|
| model call | timeout, smaller model, streaming |
| vector search | indexes, smaller filters |
| reranking | only use when needed |
| tool calls | parallelize safe reads |
| huge context | compress or reduce chunks |

## Production Readiness Checklist

- API keys in secrets
- auth on AI endpoints
- request size limit
- prompt injection controls
- model output validation
- read-only tools first
- RAG metadata filters
- source citations
- fallback behavior
- latency metrics
- token/cost metrics
- evaluation test set
- documented limitations
