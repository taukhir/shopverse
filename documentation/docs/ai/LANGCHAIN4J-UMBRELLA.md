---
title: LangChain4j Track
sidebar_position: 6.25
---

# LangChain4j Track

Use this page as the umbrella for learning LangChain4j properly.

![LangChain4j AI Service flow](/img/diagrams/langchain4j-ai-service-flow.svg)

Official references:

- [LangChain4j Introduction](https://docs.langchain4j.dev/intro/)
- [LangChain4j tutorials](https://docs.langchain4j.dev/category/tutorials/)
- [AI Services](https://docs.langchain4j.dev/tutorials/ai-services/)
- [Tools](https://docs.langchain4j.dev/tutorials/tools/)
- [RAG](https://docs.langchain4j.dev/tutorials/rag/)

## What To Learn In Order

| Order | Topic | Why |
|---|---|---|
| 1 | why LangChain4j exists | unified Java APIs for LLM apps |
| 2 | low-level vs high-level APIs | know primitives before AI Services |
| 3 | `ChatModel` | direct model calls |
| 4 | AI Services | Java interface backed by LLM |
| 5 | `@SystemMessage` and `@UserMessage` | declarative prompting |
| 6 | structured outputs | return Java records/classes |
| 7 | chat memory | follow-up conversation |
| 8 | `@Tool` | connect model to Java methods |
| 9 | embedding model and embedding store | vector search foundation |
| 10 | `RetrievalAugmentor` | RAG pipeline entry point |
| 11 | reranking/query transformation | advanced RAG |
| 12 | Spring Boot integration | use inside Spring apps |

## LangChain4j Mental Model

Low-level:

```text
ChatModel + Messages + EmbeddingModel + EmbeddingStore
```

High-level:

```text
Java interface
  -> AI Service proxy
  -> model + memory + tools + retrieval
```

Tool flow:

```text
User asks -> model requests @Tool -> Java method validates -> backend data returns
```

RAG flow:

```text
Question -> RetrievalAugmentor -> ContentRetriever -> EmbeddingStore -> model
```

## Pages In This Track

| Page | Study goal |
|---|---|
| [LangChain4j tutorials for Java and Spring developers](LANGCHAIN4J-TUTORIALS.md) | step-by-step tutorial track |
| [Tutorial 1: Chat Models And Messages](LANGCHAIN4J-TUTORIAL-CHAT-MODELS.md) | low-level model calls, parameters, streaming |
| [Tutorial 2: AI Services And Structured Outputs](LANGCHAIN4J-TUTORIAL-AI-SERVICES.md) | interfaces, prompt annotations, typed returns |
| [Tutorial 3: Tools, Memory And Guardrails](LANGCHAIN4J-TUTORIAL-TOOLS-MEMORY.md) | Java method tools, secure memory, guardrails |
| [Tutorial 4: RAG And Embedding Stores](LANGCHAIN4J-TUTORIAL-RAG.md) | ingestion, retrieval augmentor, embedding stores |
| [Tutorial 5: Spring Boot Integration And Production](LANGCHAIN4J-TUTORIAL-SPRING-BOOT.md) | Spring beans, config, logging, testing, observability |
| [LangChain4j deep dive](LANGCHAIN4J-DEEP-DIVE.md) | main LangChain4j reference |
| [AI frameworks from zero](AI-FRAMEWORKS-FROM-ZERO.md) | framework abstraction background |
| [Java AI code cookbook](JAVA-AI-CODE-COOKBOOK.md) | LangChain4j snippets |
| [Spring AI vs LangChain4j](SPRING-AI-VS-LANGCHAIN4J.md) | comparison for interviews |
| [Advanced AI topics](ADVANCED-AI-TOPICS.md) | advanced RAG, reranking, agents |
| [AI security and guardrails](AI-SECURITY-GUARDRAILS.md) | secure tools, memory, and retrieval |

## Minimum LangChain4j Skill Set

You should be able to build and explain:

- AI Service interface
- system and user message annotations
- structured Java return type
- tool method using `@Tool`
- memory scope per user/conversation
- RAG with `RetrievalAugmentor`
- embedding store retrieval
- secure tool validation

## Interview Story

> LangChain4j simplifies Java LLM applications using Java-native abstractions.
> Its high-level AI Services let me define an interface and let the framework
> connect it to a model, memory, tools, structured outputs, and RAG. It is not a
> Python LangChain port; it is designed for Java conventions such as interfaces,
> annotations, POJOs, and type safety.
