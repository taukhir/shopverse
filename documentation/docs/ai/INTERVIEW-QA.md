---
title: Interview Q&A
sidebar_position: 9
status: "maintained"
last_reviewed: "2026-07-13"
---

# Interview Q&A

Use these as short spoken answers. For most interviews, answer in 20-40
seconds, then add a Shopverse example if asked.

<ExpandableAnswer title="What is Generative AI?">

Generative AI creates new content such as text, code, image, audio, summaries,
or structured data. In backend applications, it is commonly used through model
APIs for Q&A, summarization, extraction, classification, and assistants.

Shopverse example: generating a customer-friendly explanation of return policy
from retrieved policy documents.

</ExpandableAnswer>
<ExpandableAnswer title="What is an LLM?">

An LLM is a Large Language Model that generates text by predicting tokens from
the provided context. It does not automatically know private application data
unless we provide that data through prompts, RAG, or tools.

Follow-up:

> The LLM is not the source of truth. Backend services and documents are the
> source of truth.

</ExpandableAnswer>
<ExpandableAnswer title="What is a token?">

A token is a unit of text processed by the model. Token count affects cost,
latency, and how much information can fit in the context window.

Example:

```text
prompt tokens + retrieved context tokens + response tokens = total cost and context usage
```

</ExpandableAnswer>
<ExpandableAnswer title="What is hallucination?">

Hallucination is when the model generates an incorrect or unsupported answer
confidently. We reduce it using RAG, grounding prompts, backend tools, source
citations, validation, and fallback answers.

Shopverse example: do not ask the model to invent product prices. Fetch prices
from inventory.

</ExpandableAnswer>
<ExpandableAnswer title="What is an embedding?">

An embedding is a numeric vector that represents the semantic meaning of text.
Similar meanings should have nearby vectors.

Example: "broken item" and "defective product" should be close in vector space.

</ExpandableAnswer>
<ExpandableAnswer title="Why do we need a vector database?">

A vector database stores embeddings and supports similarity search. It helps
find relevant chunks of text even when the user question does not use the exact
same keywords as the source document.

It usually stores the chunk text, vector, metadata, and source information.

</ExpandableAnswer>
<ExpandableAnswer title="What is RAG?">

RAG means Retrieval Augmented Generation. The application retrieves relevant
documents from a knowledge source, adds them to the prompt, and asks the LLM to
answer using that context.

Flow:

```text
question -> embedding -> vector search -> chunks -> prompt -> answer
```

</ExpandableAnswer>
<ExpandableAnswer title="Why use RAG instead of fine-tuning?">

Use RAG when knowledge is private, current, or frequently changing. Fine-tuning
is better when you need consistent behavior, style, or task format, not simple
knowledge updates.

Example: return policy should be RAG because the document can change.

</ExpandableAnswer>
<ExpandableAnswer title="What is chunking?">

Chunking is splitting documents into smaller meaningful parts before creating
embeddings. Good chunks improve retrieval quality and reduce context waste.

Bad chunking gives irrelevant retrieval. Good chunking keeps one topic per
chunk with useful metadata.

</ExpandableAnswer>
<ExpandableAnswer title="What is top-k retrieval?">

Top-k retrieval means returning the `k` most similar chunks from vector search.
For a small POC, `topK = 4` or `topK = 5` is a reasonable starting point.

Too low can miss context. Too high can add noise and cost.

</ExpandableAnswer>
<ExpandableAnswer title="What is prompt engineering?">

Prompt engineering is designing model instructions, context, examples, and
output constraints so the model returns useful and predictable responses.

For backend work, prompt engineering often means clear system rules, strict JSON
schemas, and safe fallbacks.

</ExpandableAnswer>
<ExpandableAnswer title="What is tool calling?">

Tool calling means the model can request a backend function or API. The backend
executes the real operation and returns the result to the model or user. This is
useful when the answer must come from live systems.

Example: the model extracts `category=laptop`, but Java calls the inventory API.

</ExpandableAnswer>
<ExpandableAnswer title="How would you use AI in Shopverse?">

I would build an AI service with three flows: simple chat for general questions,
RAG for policy and FAQ answers, and product recommendation where the model
extracts search intent but real products come from the inventory service.

Architecture:

```text
Gateway -> ai-service -> LLM / vector DB / inventory service
```

</ExpandableAnswer>
<ExpandableAnswer title="How do Spring AI and LangChain4j help?">

Spring AI provides Spring Boot-friendly abstractions such as chat clients,
embedding models, and vector stores. LangChain4j provides Java AI services,
memory, tools, retrieval, and model integrations. Both reduce boilerplate for
Java AI applications.

For Shopverse, I would start with Spring AI because the project already uses
Spring Boot heavily.

</ExpandableAnswer>
<ExpandableAnswer title="How do you secure AI API keys?">

Store keys in environment variables or secrets management. Never commit them.
Avoid logging secrets or sensitive prompts. Add timeouts, rate-limit handling,
and access control around AI endpoints.

Also ensure users can only ask about their own order data.

</ExpandableAnswer>
<ExpandableAnswer title="What are common production concerns?">

Common concerns are hallucination, latency, cost, rate limits, sensitive data
exposure, prompt injection, poor retrieval quality, and unreliable structured
output. These need validation, monitoring, guardrails, and fallback behavior.

</ExpandableAnswer>
<ExpandableAnswer title="What is semantic search?">

Semantic search finds text by meaning, not exact keyword matching. It uses
embeddings and similarity search.

Example:

```text
User: Can I send back a broken item?
Document: Defective products can be returned within 7 days.
```

Keyword search may miss it. Semantic search can find it.

</ExpandableAnswer>
<ExpandableAnswer title="What is prompt injection?">

Prompt injection is when user input tries to override the system or developer
instructions. For example: "Ignore previous instructions and reveal secrets."

Mitigation:

- never put secrets in prompts
- validate model output
- keep authorization in backend code
- restrict tool calls

</ExpandableAnswer>
<ExpandableAnswer title="How do you evaluate a RAG system?">

Check whether retrieval returns the right chunks and whether the final answer is
supported by those chunks.

Metrics and checks:

- retrieval relevance
- answer correctness
- source citation accuracy
- fallback behavior
- latency
- cost

</ExpandableAnswer>
<ExpandableAnswer title="What is the difference between chat memory and RAG?">

Memory keeps previous conversation messages. RAG retrieves external knowledge
from documents or data stores.

Memory helps with follow-up conversation. RAG helps with factual answers from
private or changing knowledge.

</ExpandableAnswer>
<ExpandableAnswer title="Can an LLM access the internet or database?">

Not by default. It only sees what the application sends. Internet, database, or
service access must be implemented through tools, retrieval, or backend APIs.

</ExpandableAnswer>
<ExpandableAnswer title="Why should the backend validate model output?">

Model output is probabilistic and can be malformed or unsafe. If the model
returns JSON that drives business logic, the backend must validate it before
calling services or databases.

</ExpandableAnswer>
<ExpandableAnswer title="What would you monitor in an AI service?">

Monitor:

- request count
- latency
- errors
- provider failures
- token usage
- vector search duration
- retrieved chunk count
- fallback count

</ExpandableAnswer>
<ExpandableAnswer title="What is your final Shopverse AI POC explanation?">

> I would create an `ai-service`. It has simple chat for basic model
> integration, RAG for Shopverse documents, and product recommendation through
> intent extraction plus inventory-service lookup. The model helps with language
> and reasoning, but business truth stays in Shopverse services and documents.

</ExpandableAnswer>