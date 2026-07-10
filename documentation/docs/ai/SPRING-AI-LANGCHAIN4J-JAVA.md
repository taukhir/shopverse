---
title: Spring AI, LangChain4j And Java AI
sidebar_position: 6
---

# Spring AI, LangChain4j And Java AI

This page is the quick index for the Java AI framework notes. Use the deep-dive
pages when you want interview-level detail.

## Official References

| Topic | Link |
|---|---|
| Spring Generative AI overview | [spring.io/ai](https://spring.io/ai/) |
| Spring AI project page | [spring.io/projects/spring-ai](https://spring.io/projects/spring-ai/) |
| Spring AI reference documentation | [docs.spring.io/spring-ai](https://docs.spring.io/spring-ai/reference/) |
| LangChain4j tutorials | [docs.langchain4j.dev/category/tutorials](https://docs.langchain4j.dev/category/tutorials/) |
| LangChain4j AI Services | [AI Services](https://docs.langchain4j.dev/tutorials/ai-services/) |
| LangChain4j RAG | [RAG tutorial](https://docs.langchain4j.dev/tutorials/rag/) |
| LangChain4j Tools | [Tools tutorial](https://docs.langchain4j.dev/tutorials/tools/) |

## Study Order

| Step | Page | Why |
|---|---|---|
| 1 | [Java AI developer guide](JAVA-AI-DEVELOPER-GUIDE.md) | Learn the common building blocks before frameworks |
| 2 | [Spring AI deep dive](SPRING-AI-DEEP-DIVE.md) | Best fit for Shopverse and Spring Boot interviews |
| 3 | [LangChain4j deep dive](LANGCHAIN4J-DEEP-DIVE.md) | Learn AI Services, tools, memory, and RAG in Java |
| 4 | [Spring AI vs LangChain4j](SPRING-AI-VS-LANGCHAIN4J.md) | Prepare framework comparison answers |

## One-Minute Summary

| Area | Spring AI | LangChain4j |
|---|---|---|
| Primary style | Spring Boot-native framework | Java AI application library |
| Main abstraction | `ChatClient`, `EmbeddingModel`, `VectorStore`, Advisors | AI Services, `ChatModel`, tools, memory, retrieval augmentor |
| Strongest fit | Existing Spring Boot services | Interface-driven AI services and tool-heavy flows |
| RAG style | vector store plus advisors or service orchestration | retrieval augmentor plus content retrievers |
| Tool style | Java functions/tools connected to models | methods annotated/configured as tools |
| Shopverse recommendation | Primary choice | Secondary comparison and optional experiment |

## Core Java AI Mental Model

```text
Controller
  -> AI service layer
  -> prompt builder
  -> optional retrieval or tool call
  -> model provider
  -> output validation
  -> API response
```

For Shopverse:

```text
User question
  -> ai-service
  -> RAG for policies or tools for products/orders
  -> LLM writes final answer
  -> backend returns answer with sources or real entities
```

## Interview Answer

> Java AI applications still follow normal backend design. The AI provider is an
> external dependency. Spring AI gives Spring Boot-friendly abstractions for
> chat, embeddings, vector stores, tools, RAG, memory, and observability.
> LangChain4j gives Java-friendly AI Services, tools, structured outputs, memory,
> and retrieval augmentors. For Shopverse I would start with Spring AI because
> the project is already Spring Boot-based, but I understand LangChain4j's
> interface-driven style too.

