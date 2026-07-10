---
title: AI Frameworks From Zero
sidebar_position: 6.05
---

# AI Frameworks From Zero

This guide explains Java AI frameworks in the same style as official framework
introductions: why the framework exists, what problem each abstraction solves,
how the modules fit together, and how to think from beginner to advanced.

Official references:

- [Spring AI](https://spring.io/projects/spring-ai/)
- [Spring Generative AI](https://spring.io/ai/)
- [LangChain4j Introduction](https://docs.langchain4j.dev/intro/)
- [LangChain4j Tutorials](https://docs.langchain4j.dev/category/tutorials/)

## Why AI Frameworks Exist

You can call an LLM with a raw HTTP client.

That works for a demo:

```text
HTTP request -> model provider -> response text
```

But real applications quickly need more:

| Need | Why raw HTTP becomes painful |
|---|---|
| provider switching | each provider has different APIs |
| prompts | repeated string building becomes messy |
| chat history | memory needs storage and trimming |
| structured output | JSON parsing and retry logic needed |
| embeddings | separate model API and vector storage |
| RAG | ingestion, chunking, retrieval, prompt assembly |
| tools | secure mapping from model requests to Java methods |
| observability | metrics, latency, token usage, failures |
| security | prompt injection, data leakage, role filters |

Frameworks such as Spring AI and LangChain4j provide reusable abstractions for
these repeated problems.

## First Principle

Do not start by memorizing classes.

Start with this flow:

```text
User request
  -> Java service
  -> optional retrieval or tool call
  -> prompt
  -> model
  -> validation
  -> response
```

After that, learn which framework class owns each step.

## Two Levels Of Abstraction

![AI framework abstraction levels](/img/diagrams/ai-abstraction-levels.svg)

Most Java AI libraries have two levels:

| Level | What you use | Pros | Cons |
|---|---|---|---|
| Low-level | chat model, messages, embedding model, vector store | maximum control | more glue code |
| High-level | Spring AI `ChatClient`/advisors, LangChain4j AI Services | faster application code | some behavior hidden |

Beginner recommendation:

1. Learn low-level concepts first.
2. Use high-level APIs when building features.

## Module Mental Model

![AI framework module map](/img/diagrams/ai-framework-module-map.svg)

Most AI frameworks separate:

| Layer | Responsibility |
|---|---|
| core abstractions | stable interfaces like chat model and embedding model |
| high-level APIs | simpler developer experience |
| integrations | provider-specific and vector-store-specific modules |
| application code | your controllers, services, DTOs, prompts, tools |

This is why switching provider should not require rewriting your business
service layer.

## What Spring AI Gives You

Spring AI focuses on the Spring ecosystem.

Important ideas:

- Spring Boot auto-configuration
- `ChatClient`
- `EmbeddingModel`
- `VectorStore`
- prompt templates
- structured outputs
- tools/function calling
- advisors
- chat memory
- RAG
- observability
- ETL/document ingestion concepts
- evaluation support

Spring AI style:

```java
String answer = chatClient.prompt()
    .system("You are the Shopverse assistant.")
    .user(question)
    .call()
    .content();
```

Best when:

- your app is already Spring Boot
- you want Spring configuration and dependency injection
- you want AI code to look like normal Spring service code

## What LangChain4j Gives You

The LangChain4j intro emphasizes three big goals:

- unified APIs for many model providers and embedding stores
- a toolbox of common LLM app patterns
- many examples for quickly building LLM-powered Java apps

LangChain4j is not a Python LangChain port. It is designed for Java conventions:
interfaces, annotations, type safety, POJOs, dependency injection, and fluent
APIs.

LangChain4j style:

```java
interface ShopverseAssistant {

    @SystemMessage("You are the Shopverse assistant.")
    String answer(String question);
}
```

Best when:

- you like interface-driven AI services
- you want declarative prompts and tools
- you want a Java library usable beyond Spring AI

## Common Feature Families

| Feature family | What it means | Shopverse example |
|---|---|---|
| chat | generate response from messages | `/api/ai/chat` |
| prompt templates | reusable prompts with variables | RAG prompt |
| memory | preserve conversation state | follow-up support chat |
| tools | model asks Java to run function | search products |
| embeddings | convert text to vectors | embed return policy |
| vector store | semantic search over chunks | retrieve policy chunks |
| RAG | retrieve then generate | policy Q&A |
| reranking | reorder retrieved chunks | improve RAG quality |
| moderation | detect unsafe content | abusive message fallback |
| structured output | typed Java result | `ProductIntent` |
| streaming | token-by-token response | chat UI |
| evaluation | test answer quality | expected Q&A dataset |

## Beginner To Advanced Learning Order

| Stage | Learn | Build |
|---|---|---|
| 1 | chat model and prompt | `/api/ai/chat` |
| 2 | structured output | `/api/ai/intent` |
| 3 | embeddings and vector store | document ingestion |
| 4 | RAG | `/api/ai/rag/ask` |
| 5 | tools | product recommendation |
| 6 | memory and streaming | conversational UI |
| 7 | advanced RAG | hybrid search, reranking |
| 8 | production security | RBAC, moderation, rate limits |
| 9 | evaluation | regression test dataset |

## How To Read Framework Docs

When reading official docs, always ask:

1. What problem does this abstraction solve?
2. What lower-level code does it hide?
3. What is the equivalent in the other framework?
4. What security checks still belong in my Java code?
5. How would I demo this in Shopverse?

Example:

```text
LangChain4j AI Services
  -> problem: hide LLM boilerplate behind a Java interface
  -> equivalent: Spring AI service using ChatClient
  -> security: Java still validates tools and output
  -> Shopverse: ShopverseAssistant interface
```

## Interview-Level Explanation

> AI frameworks exist because real LLM apps need more than a single HTTP call.
> They need prompts, memory, structured output, embeddings, vector stores, RAG,
> tools, security, and observability. Spring AI gives these patterns in a
> Spring-native way. LangChain4j gives Java-native AI Services, tools, memory,
> and RAG abstractions. I would learn the low-level flow first, then use the
> framework to reduce boilerplate.

