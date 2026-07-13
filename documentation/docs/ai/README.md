---
title: AI Learning Track
sidebar_position: 1
status: "maintained"
last_reviewed: "2026-07-13"
---

# AI Learning Track

This track is for interview preparation and hands-on practice around LLMs,
Generative AI, RAG, vector databases, Spring AI, Java AI integration, API
integration, and LangChain4j.

The target level is basics to practical beginner: you should be able to explain
core concepts clearly, draw the request flow, and demonstrate one working POC
inside Shopverse.

![Shopverse AI assistant architecture](/img/diagrams/ai-shopverse-architecture.svg)

## How To Use This Track

Read this as a backend engineer, not as a data scientist. You do not need to
derive transformer math for a basic Java backend interview. You do need to
explain where the AI call sits in your service, how data reaches the model, how
you avoid hallucinated business answers, and how you would observe and secure
the integration.

The best study method is:

1. Learn the concept.
2. Write the request flow in plain text.
3. Connect the concept to Shopverse.
4. Prepare a 30-second interview answer.
5. Add one small hands-on lab.

## Study Order

| Step | Topic | Outcome |
|---|---|---|
| 1 | LLM and Generative AI fundamentals | Explain what an LLM does, what tokens are, and why hallucination happens |
| 2 | Prompting and API integration | Call an AI API safely from Java and control output shape |
| 3 | Embeddings and vector search | Explain semantic search and similarity |
| 4 | Vector databases | Store chunks, embeddings, and metadata for retrieval |
| 5 | RAG | Build grounded Q&A over private Shopverse documents |
| 6 | Spring AI | Use Java/Spring abstractions for chat, embeddings, and vector stores |
| 7 | LangChain4j | Understand AI services, tools, memory, and retrieval in Java |
| 8 | Shopverse AI POC | Build an interview-ready demonstration |

## Core Mental Models

| Topic | Mental model |
|---|---|
| LLM | A text engine that predicts the next useful tokens from the prompt |
| Prompt | Instructions plus input data sent to the model |
| Embedding | Meaning converted into a numeric vector |
| Vector DB | Similarity search over meaning instead of exact words |
| RAG | Search first, then ask the model to answer from retrieved context |
| Tool calling | Let the model choose an action, but let backend code execute it |
| Spring AI | Spring Boot abstractions for chat, embeddings, vector stores, and advisors |
| LangChain4j | Java AI services, memory, tools, and retrieval abstractions |

## Interview Priority

If you have limited time, focus on these five flows:

| Flow | Why it matters |
|---|---|
| Simple chat | Shows basic LLM API integration |
| JSON extraction | Shows controlled model output |
| Embedding creation | Shows how semantic search starts |
| RAG Q&A | Shows real enterprise AI usage |
| Product recommendation with real API data | Shows you understand hallucination risk |

## Organized Tracks

### Start Here

| Document | Use it for |
|---|---|
| [Beginner to advanced AI guide](BEGINNER-TO-ADVANCED-GUIDE.md) | Full roadmap from basics to production AI |
| [AI visual learning guide](VISUAL-LEARNING-GUIDE.md) | images, animations, flow diagrams, sequence diagrams, and architecture diagrams |
| [AI learning plan](AI-LEARNING-PLAN.md) | Daily plan, milestones, and outcomes |
| [AI frameworks from zero](AI-FRAMEWORKS-FROM-ZERO.md) | Tutorial-style intro to why Spring AI and LangChain4j exist |
| [Spring AI, LangChain4j, and Java AI](SPRING-AI-LANGCHAIN4J-JAVA.md) | Java AI ecosystem entry page |

### Core AI Concepts

| Document | Use it for |
|---|---|
| [LLM and Generative AI fundamentals](LLM-GENERATIVE-AI-FUNDAMENTALS.md) | tokens, prompts, hallucination, model basics |
| [API integration and prompting](API-INTEGRATION-PROMPTING.md) | Java API calls, prompt design, JSON output, errors |
| [Embeddings, vector DB, and RAG](EMBEDDINGS-VECTOR-DB-RAG.md) | semantic search, vector stores, chunking, RAG |
| [Advanced AI topics](ADVANCED-AI-TOPICS.md) | hybrid search, reranking, evaluation, agents, cost, latency |

### Java AI

| Document | Use it for |
|---|---|
| [Java AI developer guide](JAVA-AI-DEVELOPER-GUIDE.md) | Java-side architecture, DTOs, tools, RAG, security, observability |
| [Java AI code cookbook](JAVA-AI-CODE-COOKBOOK.md) | practical Java, Spring AI, and LangChain4j snippets |

### Spring AI

| Document | Use it for |
|---|---|
| [Spring AI track](SPRING-AI-UMBRELLA.md) | umbrella page and study order |
| [Spring AI deep dive](SPRING-AI-DEEP-DIVE.md) | detailed Spring AI notes for quick mastery |

### LangChain4j

| Document | Use it for |
|---|---|
| [LangChain4j track](LANGCHAIN4J-UMBRELLA.md) | umbrella page and study order |
| [LangChain4j deep dive](LANGCHAIN4J-DEEP-DIVE.md) | AI Services, tools, memory, RAG, and framework structure |

### Comparison, Security, And Practice

| Document | Use it for |
|---|---|
| [Spring AI vs LangChain4j](SPRING-AI-VS-LANGCHAIN4J.md) | framework comparison and interview decision guide |
| [AI security and guardrails](AI-SECURITY-GUARDRAILS.md) | prompt injection, secure RAG, role filters, tool authorization, abuse control, data isolation |
| [Shopverse AI POC plan](SHOPVERSE-AI-POC-PLAN.md) | concrete POC design for this project |
| [Hands-on labs](HANDS-ON-LABS.md) | small exercises to build confidence |
| [Interview Q&A](INTERVIEW-QA.md) | short answers for common interview questions |

## Final Interview Story

<ExpandableAnswer title="What should an architect explain about AI Learning Track?">

For **AI Learning Track**, a strong answer starts with the runtime responsibility and the invariant that must remain true. It then walks through one Shopverse request or event, names the important boundary, and explains the failure behavior rather than describing only the happy path. Close with the trade-off, the production signal that verifies the design, and the condition that would justify a different approach. This structure demonstrates practical judgment without memorizing isolated definitions.

</ExpandableAnswer>

By the end, you should be able to say:

> I built a Shopverse AI assistant using Spring Boot. It answers policy and FAQ
> questions using RAG. Documents are chunked, embedded, stored in a vector
> database, retrieved by semantic similarity, and passed to the LLM with the
> user question. For product recommendations, the AI extracts intent and the
> backend calls existing product APIs instead of trusting generated product
> data.

## What Not To Say In Interviews

Avoid answers like:

- "The AI knows our database."
- "RAG means training the model with documents."
- "Vector DB is like Redis cache."
- "Fine-tuning is always better than RAG."
- "The LLM recommends products directly."

Better answers:

- "The model only knows what we send in the prompt or retrieve through tools."
- "RAG retrieves relevant context at request time; it does not retrain the model."
- "A vector DB stores embeddings for similarity search."
- "RAG is usually better for private and changing knowledge."
- "For products, the model extracts intent and the backend fetches real data."
