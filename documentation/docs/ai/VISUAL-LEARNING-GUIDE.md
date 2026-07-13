---
title: AI Visual Learning Guide
sidebar_position: 1.2
status: "maintained"
last_reviewed: "2026-07-13"
---

# AI Visual Learning Guide

This page collects the images, animated diagrams, flow diagrams, sequence
diagrams, architecture diagrams, and use-case maps used across the AI learning
track.

## Learning Roadmap

![Beginner to advanced roadmap](/img/diagrams/ai-beginner-to-advanced-roadmap.svg)

Use this first. It shows the order:

```text
LLM basics -> embeddings -> RAG -> tools -> production security/evaluation
```

## Generative AI Use Cases

![Generative AI use cases for Shopverse](/img/diagrams/ai-use-cases-map.svg)

Use this to remember where Generative AI fits in a commerce backend:

| Use case | Pattern |
|---|---|
| policy Q&A | RAG |
| product recommendation | structured output + real API data |
| support routing | classification |
| review summary | summarization |
| admin help | secure RAG |

## Architecture Diagrams

### Shopverse AI Assistant Architecture

![Shopverse AI assistant architecture](/img/diagrams/ai-shopverse-architecture.svg)

### Java AI Framework Module Map

![AI framework module map](/img/diagrams/ai-framework-module-map.svg)

### Java AI Component Map

![Java AI component map](/img/diagrams/ai-component-map.svg)

## Framework Flow Diagrams

### Spring AI ChatClient Flow

![Spring AI ChatClient flow](/img/diagrams/spring-ai-chatclient-flow.svg)

### LangChain4j AI Service Flow

![LangChain4j AI Service flow](/img/diagrams/langchain4j-ai-service-flow.svg)

### Abstraction Levels

![AI framework abstraction levels](/img/diagrams/ai-abstraction-levels.svg)

## Prompting And Structured Output

![Prompt lifecycle](/img/diagrams/ai-prompt-lifecycle.svg)

Sequence:

```mermaid
sequenceDiagram
    participant Client
    participant API as Spring Controller
    participant Service as AI Service
    participant Model as LLM Provider

    Client->>API: POST /api/ai/intent
    API->>Service: ChatRequest
    Service->>Service: Build prompt with schema
    Service->>Model: Prompt + user message
    Model-->>Service: JSON-like output
    Service->>Service: Parse and validate DTO
    Service-->>API: ProductIntent
    API-->>Client: API response
```

## Embeddings, Vector Search, And Chunking

### Keyword Search vs Vector Search

![Keyword search versus vector search](/img/diagrams/ai-vector-search.svg)

### Chunking Strategy

![Chunking strategy](/img/diagrams/ai-chunking-strategy.svg)

## RAG Flow Diagrams And Animations

### Static RAG Flow

![RAG flow](/img/diagrams/ai-rag-flow.svg)

### Animated RAG Ingestion

![RAG ingestion GIF](/img/diagrams/rag-ingestion.gif)

Lightweight SVG version:

![Animated RAG ingestion](/img/diagrams/animated-rag-ingestion.svg)

### Animated RAG Runtime

![RAG runtime GIF](/img/diagrams/rag-runtime.gif)

Lightweight SVG version:

![Animated RAG runtime](/img/diagrams/animated-rag-runtime.svg)

Sequence:

```mermaid
sequenceDiagram
    participant User
    participant API as AI API
    participant VDB as Vector DB
    participant LLM

    User->>API: Ask policy question
    API->>VDB: Similarity search with role filters
    VDB-->>API: Relevant allowed chunks
    API->>LLM: Question + allowed context
    LLM-->>API: Grounded answer
    API-->>User: Answer + sources
```

## Tool Calling And Backend Data

### Static Tool Calling Flow

![Tool calling pattern](/img/diagrams/ai-tool-calling.svg)

### Animated Tool Authorization

![Tool authorization GIF](/img/diagrams/tool-authorization.gif)

Lightweight SVG version:

![Animated tool authorization](/img/diagrams/animated-tool-authorization.svg)

Sequence:

```mermaid
sequenceDiagram
    participant User
    participant AI as AI Service
    participant Tool as Java Tool Gateway
    participant Inventory as Inventory Service

    User->>AI: Suggest gaming laptops under 50000
    AI->>AI: Extract tool arguments
    AI->>Tool: searchProducts(category, maxPrice)
    Tool->>Tool: Validate arguments and user permissions
    Tool->>Inventory: Search real products
    Inventory-->>Tool: Product list
    Tool-->>AI: Real products
    AI-->>User: Recommendation using real products
```

## Security And Guardrails

### Security Layers

![AI security layers](/img/diagrams/ai-security-layers.svg)

### Authorization-Aware RAG

![Role based RAG](/img/diagrams/ai-rbac-rag.svg)

### Prompt Injection Defense

![Prompt injection defense GIF](/img/diagrams/prompt-injection-defense.gif)

Lightweight SVG version:

![Animated prompt injection defense](/img/diagrams/animated-prompt-injection-defense.svg)

### Secure Memory Isolation

![Memory isolation](/img/diagrams/ai-memory-isolation.svg)

Security sequence:

```mermaid
sequenceDiagram
    participant User
    participant API
    participant Auth as Authorization
    participant VDB as Vector DB
    participant LLM

    User->>API: Ask about private order
    API->>Auth: Check user identity and role
    Auth-->>API: userId, roles, tenant
    API->>VDB: Search with tenant/user/role filter
    VDB-->>API: Only authorized chunks
    API->>LLM: Authorized context only
    LLM-->>API: Answer
    API-->>User: Safe response
```

## Evaluation And Production

![AI evaluation lifecycle](/img/diagrams/ai-evaluation-lifecycle.svg)

Production sequence:

```mermaid
flowchart LR
    Tests["Evaluation dataset"] --> Run["Run prompts and RAG"]
    Run --> Score["Score retrieval, answer, safety"]
    Score --> Review["Review failures"]
    Review --> Improve["Improve chunks, prompts, filters"]
    Improve --> Tests
```

## Visual Study Checklist

Use this checklist before interview revision:

| Can you explain this visual? | Diagram |
|---|---|
| AI learning order | roadmap |
| where AI fits in Shopverse | architecture |
| Spring AI flow | ChatClient flow |
| LangChain4j flow | AI Service flow |
| prompt construction | prompt lifecycle |
| semantic search | vector search diagram |
| document chunking | chunking strategy |
| RAG ingestion/runtime | animated RAG diagrams |
| tool calling | tool authorization diagrams |
| user-data isolation | RBAC RAG and memory isolation |
| prompt injection defense | animated security diagram |
| production improvement loop | evaluation lifecycle |
