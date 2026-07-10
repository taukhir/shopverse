---
title: Spring AI Track
sidebar_position: 6.15
---

# Spring AI Track

Use this page as the umbrella for mastering Spring AI as a Java/Spring Boot
developer.

Official references:

- [Spring Generative AI](https://spring.io/ai/)
- [Spring AI project](https://spring.io/projects/spring-ai/)
- [Spring AI reference docs](https://docs.spring.io/spring-ai/reference/)

## What To Learn In Order

| Order | Topic | Why |
|---|---|---|
| 1 | Spring AI purpose | understand why it exists in Spring ecosystem |
| 2 | `ChatClient` | basic model integration |
| 3 | prompts and options | control model behavior |
| 4 | structured output | map response to Java DTOs |
| 5 | `EmbeddingModel` | convert text into vectors |
| 6 | `VectorStore` | store/search vectors for RAG |
| 7 | RAG | answer from private documents |
| 8 | tools/function calling | connect model to real Spring services |
| 9 | advisors | reuse RAG/memory behavior |
| 10 | memory | support follow-up chat |
| 11 | observability | monitor latency, errors, token usage |
| 12 | security | protect user data and tools |

## Spring AI Mental Model

```text
Spring MVC Controller
  -> Spring service
  -> ChatClient / EmbeddingModel / VectorStore
  -> model provider and vector database
```

For RAG:

```text
Document -> chunks -> embeddings -> VectorStore
Question -> VectorStore search -> context -> ChatClient -> answer
```

For tools:

```text
Question -> model decides tool need -> Spring service validates -> backend API call
```

## Pages In This Track

| Page | Study goal |
|---|---|
| [Spring AI deep dive](SPRING-AI-DEEP-DIVE.md) | main Spring AI reference |
| [Java AI developer guide](JAVA-AI-DEVELOPER-GUIDE.md) | Java architecture patterns Spring AI uses |
| [Java AI code cookbook](JAVA-AI-CODE-COOKBOOK.md) | Spring AI-style code snippets |
| [Embeddings, Vector DB and RAG](EMBEDDINGS-VECTOR-DB-RAG.md) | retrieval foundation |
| [AI security and guardrails](AI-SECURITY-GUARDRAILS.md) | secure Spring AI implementation |
| [Spring AI vs LangChain4j](SPRING-AI-VS-LANGCHAIN4J.md) | comparison for interviews |

## Minimum Spring AI Developer Skill Set

You should be able to build and explain:

- simple chat endpoint using `ChatClient`
- prompt template for controlled answers
- JSON/structured output for intent extraction
- document ingestion with chunking and embeddings
- RAG endpoint using vector search
- product recommendation where real data comes from inventory service
- role-aware retrieval filters
- secure tool execution
- metrics and fallback behavior

## Interview Story

> Spring AI lets Spring Boot developers build AI applications using familiar
> Spring patterns. In Shopverse, I would use `ChatClient` for model calls,
> `EmbeddingModel` and `VectorStore` for RAG, structured output for intent
> extraction, and tools/function calling to connect the model to real services
> like inventory and orders. I would keep authorization, validation, and data
> filtering in backend code.

