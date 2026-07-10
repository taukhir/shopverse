---
title: AI Learning Plan
sidebar_position: 2
---

# AI Learning Plan

## Goal

Prepare for interviews where the expected level is basics plus one clear
hands-on POC. The focus is not deep ML math. The focus is practical backend
understanding:

- what LLMs do
- how API-based AI apps work
- why embeddings and vector databases are used
- how RAG works
- how Java developers use Spring AI and LangChain4j
- how to explain one Shopverse AI assistant POC end to end

## 14-Day Plan

| Day | Topic | What To Learn | Output |
|---|---|---|---|
| 1 | LLM basics | Tokens, context window, temperature, model input/output | Explain one chat request flow |
| 2 | Generative AI use cases | Summarization, classification, extraction, Q&A, code generation | List use cases for Shopverse |
| 3 | Prompting | System prompt, user prompt, examples, constraints | Write prompts for JSON extraction |
| 4 | Java API integration | REST client, API key, timeout, retry, error handling | Build simple `/api/ai/chat` locally |
| 5 | Embeddings | Vector representation, semantic similarity, cosine similarity | Explain keyword vs semantic search |
| 6 | Vector DB | Chunk storage, metadata, top-k search, filters | Choose PGVector or Qdrant for POC |
| 7 | RAG basics | Retrieve context, augment prompt, generate answer | Draw the RAG sequence diagram |
| 8 | RAG quality | chunking, overlap, metadata, source citation, hallucination control | Improve answer grounding |
| 9 | Spring AI | ChatClient, EmbeddingModel, VectorStore, advisors | Map Spring AI classes to RAG flow |
| 10 | LangChain4j | AI services, memory, tools, retrieval augmentor | Compare with Spring AI |
| 11 | Shopverse POC design | AI assistant scope, endpoints, data, security | Finalize architecture |
| 12 | Shopverse POC build | Chat endpoint, document ingestion, retrieval | Working backend demo |
| 13 | Product recommendation | Intent extraction, product service call, structured response | Demo real API integration |
| 14 | Interview rehearsal | Q&A, diagrams, trade-offs, limitations | 5-minute demo script |

## Daily Study Format

Use the same routine every day:

1. Read the topic for 30-45 minutes.
2. Write the flow in your own words.
3. Implement or simulate one small example.
4. Prepare one interview answer.
5. Add one note connecting it to Shopverse.

Example for RAG:

```text
Concept: RAG retrieves documents before asking the LLM.
Flow: question -> embedding -> vector DB -> chunks -> prompt -> answer.
Shopverse: answer return policy questions from policy docs.
Interview answer: RAG is useful for private or changing knowledge.
```

## Minimum Must-Know Concepts

| Concept | One-line understanding |
|---|---|
| LLM | A model that predicts and generates text based on context |
| Token | The unit of text processed by the model |
| Context window | Maximum input plus output tokens the model can handle |
| Temperature | Controls randomness of generated output |
| Hallucination | Confident but incorrect generated answer |
| Embedding | Numeric vector representing semantic meaning |
| Vector DB | Database optimized for similarity search over embeddings |
| RAG | Retrieval Augmented Generation; retrieve private context before generating |
| Chunking | Splitting documents into smaller retrievable units |
| Top-k | Number of similar chunks returned from vector search |
| Tool calling | Letting the model request backend functions instead of inventing data |

## Weekly Milestones

### Week 1: Theory Plus Small API Calls

You should be able to explain:

- LLM vs Generative AI
- prompt vs completion
- embedding vs normal text
- semantic search vs SQL search
- simple Java API call to an AI provider

Self-check:

| Question | You should answer |
|---|---|
| Why can an LLM hallucinate? | because it generates likely text without guaranteed truth |
| Why not put whole docs in prompt? | context limit, cost, noise |
| Why use structured output? | safer parsing and backend decisions |
| Where should API keys live? | environment variables or secrets manager |

### Week 2: RAG Plus Shopverse POC

You should be able to demonstrate:

- document ingestion
- embeddings stored in a vector database
- question retrieval
- grounded answer generation
- product recommendation using existing Shopverse data

Self-check:

| Question | You should answer |
|---|---|
| What is stored in vector DB? | chunks, embeddings, metadata |
| What happens at ingestion time? | load, chunk, embed, store |
| What happens at runtime? | embed query, retrieve, prompt, answer |
| Why call inventory service? | to avoid invented products |

## Study Time Allocation

| Area | Time |
|---|---|
| LLM and prompting basics | 20% |
| embeddings and vector DB | 20% |
| RAG | 25% |
| Spring AI and LangChain4j | 20% |
| Shopverse POC and interview practice | 15% |

Do not spend too much time on transformer internals unless the interview
explicitly asks for ML depth. For a Java backend role, integration and system
design matter more.

## Practical Rule

For interviews, do not describe AI as magic. Always explain the backend flow:

```text
Request -> validate input -> call model or embedding API -> retrieve data if needed
-> build prompt -> call LLM -> parse response -> return controlled API response
```

## Final Checklist Before Interview

- explain LLM, token, context window, temperature
- explain embedding and semantic search
- explain vector DB record structure
- draw RAG ingestion and runtime flow
- explain RAG vs fine-tuning
- explain Spring AI basics
- explain LangChain4j basics
- show the Shopverse AI POC plan
- explain how to avoid hallucinated products
- discuss security, cost, latency, and observability
