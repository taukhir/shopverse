---
title: Beginner To Advanced AI Guide
sidebar_position: 1.5
status: "maintained"
last_reviewed: "2026-07-13"
---

# Beginner To Advanced AI Guide

This is the high-level mastery path. Use it as the map for all AI notes in this
section.

![Beginner to advanced roadmap](/img/diagrams/ai-beginner-to-advanced-roadmap.svg)

## Level 1: Beginner

Goal: understand what an LLM app is and call one from Java.

Master these:

| Topic | What you should know |
|---|---|
| LLM | generates text token by token from context |
| prompt | instructions and input sent to the model |
| token | model processing unit, affects cost and context |
| temperature | randomness control |
| context window | max input plus output tokens |
| hallucination | confident unsupported answer |
| API integration | call model provider from backend service |

Build:

```http
POST /api/ai/chat
```

Interview answer:

> An LLM app is still a backend app. The controller accepts input, the service
> builds a prompt, calls a model provider, validates the response, and returns a
> controlled API response.

## Level 2: Practical Backend AI

Goal: make the model return controlled output.

Master these:

| Topic | What you should know |
|---|---|
| structured output | model returns JSON/typed object |
| classification | map text to an intent |
| extraction | extract fields like category and max price |
| validation | treat model output as untrusted |
| prompt template | reusable prompt with variables |

Build:

```http
POST /api/ai/intent
```

Example:

```json
{
  "message": "Show gaming laptops under 50000"
}
```

Output:

```json
{
  "intent": "PRODUCT_SEARCH",
  "category": "laptop",
  "maxPrice": 50000,
  "keywords": ["gaming"]
}
```

Interview answer:

> For backend workflows, I prefer structured output instead of free text. The
> model can extract intent, but Java validates the result before any business
> action.

## Level 3: Embeddings And Vector Search

Goal: search by meaning.

Master these:

| Topic | What you should know |
|---|---|
| embedding | numeric vector representing meaning |
| similarity search | find nearby vectors |
| vector DB | stores vectors and metadata |
| top-k | number of similar chunks returned |
| metadata filter | restrict search scope |

Build:

```http
POST /api/ai/documents/ingest
POST /api/ai/search
```

Interview answer:

> Embeddings convert text into vectors. A vector database lets us find similar
> meanings, so "broken item" can match a document saying "defective product."

## Level 4: RAG

Goal: answer using private documents.

Master these:

| Topic | What you should know |
|---|---|
| ingestion | documents -> chunks -> embeddings -> vector DB |
| retrieval | question -> embedding -> top-k chunks |
| grounding | answer only from retrieved context |
| citation | return source documents |
| fallback | say when answer is not found |

Build:

```http
POST /api/ai/rag/ask
```

Interview answer:

> RAG retrieves relevant context at request time and sends it to the LLM with
> the question. It is useful for private or changing data because we update
> documents instead of retraining the model.

## Level 5: Tools And Real Backend Data

Goal: prevent hallucinated business facts.

Master these:

| Topic | What you should know |
|---|---|
| tool calling | model requests backend function |
| validation | Java validates tool arguments |
| authorization | Java checks user permissions |
| read-only first | safer tools for first POC |
| generated explanation | model explains real returned data |

Build:

```http
POST /api/ai/products/recommend
```

Interview answer:

> The LLM should not invent products, prices, stock, or order status. It should
> extract intent, and Java should call the real Shopverse services.

## Level 6: Advanced RAG

Goal: improve answer quality.

Master these:

| Topic | Purpose |
|---|---|
| hybrid search | combine keyword and vector search |
| reranking | reorder retrieved chunks for relevance |
| query rewriting | improve vague user questions |
| metadata filters | prevent wrong document retrieval |
| contextual compression | reduce irrelevant retrieved text |
| evaluation dataset | test questions with expected answers |

Interview answer:

> Basic RAG is not enough for production. Retrieval quality matters, so I would
> improve chunking, add metadata filters, use hybrid search for exact terms, and
> evaluate answers against test questions.

## Level 7: Production AI

Goal: operate safely.

Master these:

| Area | What to do |
|---|---|
| security | secrets, auth, prompt injection control |
| cost | token limits, caching, rate limits |
| latency | timeouts, streaming, smaller context |
| observability | metrics for model, retrieval, tools |
| evaluation | regression tests for prompts and RAG |
| fallbacks | safe response when model/provider fails |

Interview answer:

> I would treat the model provider as an external dependency, but with
> AI-specific controls: token cost, prompt safety, retrieval quality, fallback
> answers, and tool authorization.

## Mastery Checklist

- explain LLM, tokens, prompt, context, temperature
- build simple chat endpoint
- extract structured JSON
- create embeddings
- explain vector DB record structure
- build basic RAG
- cite sources
- add product recommendation using real APIs
- compare Spring AI and LangChain4j
- discuss memory, streaming, tools, guardrails, evaluation
- explain production risks and mitigations

