---
title: Java AI Developer Guide
sidebar_position: 6.1
status: "maintained"
last_reviewed: "2026-07-13"
---

# Java AI Developer Guide

This page explains the Java-side concepts you should know before going deep
into Spring AI or LangChain4j.

## What "Java AI" Means

For backend interviews, Java AI usually means building AI-enabled applications
using Java and Spring Boot, not training models from scratch.

You are expected to know:

- how to call an LLM provider API
- how to create prompts
- how to parse and validate output
- how embeddings and vector stores fit into RAG
- how to call real backend APIs through tools/function calling
- how to handle security, cost, latency, and observability

## Java AI Building Blocks

| Building block | What it does | Example |
|---|---|---|
| Chat model | Generates text | answer customer question |
| Embedding model | Converts text into vectors | embed FAQ chunks |
| Vector store | Similarity search over vectors | find return policy chunk |
| Prompt template | Builds repeatable prompts | RAG answer prompt |
| Structured output | Maps response to DTO/POJO | `ProductIntent` |
| Tool/function | Calls backend code | `searchProducts()` |
| Memory | Sends selected chat history | follow-up support question |
| Guardrail | Controls unsafe or invalid behavior | reject missing source answer |
| Evaluator | Checks answer quality | verify answer is grounded |

## Plain HTTP Integration

Before frameworks, understand this flow:

```text
Java service -> HTTP request -> model provider -> HTTP response -> parse output
```

Pseudo-code:

```java
public ChatResponse ask(ChatRequest request) {
    validate(request);

    ProviderRequest providerRequest = promptBuilder.build(request.message());
    ProviderResponse providerResponse = aiClient.call(providerRequest);

    String answer = providerResponse.content();
    return new ChatResponse(answer);
}
```

This is useful for learning, but production code quickly needs abstractions for:

- provider switching
- retries and timeouts
- streaming
- structured output
- tool calling
- embeddings
- vector stores
- observability

That is where Spring AI and LangChain4j help.

## Service Layer Design

Recommended structure:

```text
controller
  AiChatController
  RagController

service
  ChatService
  DocumentIngestionService
  RagAnswerService
  ProductRecommendationService

model
  ChatRequest
  ChatResponse
  ProductIntent
  RagSource

config
  AiProviderProperties
  AiClientConfig
```

Keep controllers thin:

```java
@RestController
class AiChatController {

    private final ChatService chatService;

    @PostMapping("/api/ai/chat")
    ChatResponse chat(@RequestBody ChatRequest request) {
        return chatService.chat(request);
    }
}
```

The controller should not know provider-specific request JSON.

## Prompt Builder Pattern

Use a dedicated prompt builder when prompts become serious.

```java
class RagPromptBuilder {

    String build(String question, List<SourceChunk> chunks) {
        return """
            You are the Shopverse assistant.
            Answer only from the context.
            If the answer is missing, say you do not know from the provided documents.

            Context:
            %s

            Question:
            %s
            """.formatted(formatChunks(chunks), question);
    }
}
```

Why:

- prompts are easier to test
- rules are centralized
- controllers stay clean
- versioning prompts becomes easier

## Structured Output In Java

Use structured output when the model result controls backend behavior.

Example DTO:

```java
public record ProductIntent(
    String intent,
    String category,
    BigDecimal maxPrice,
    List<String> keywords
) {}
```

Validation:

```java
void validate(ProductIntent intent) {
    if (!Set.of("PRODUCT_SEARCH", "UNKNOWN").contains(intent.intent())) {
        throw new IllegalArgumentException("Unsupported intent");
    }
    if (intent.maxPrice() != null && intent.maxPrice().signum() < 0) {
        throw new IllegalArgumentException("maxPrice must be positive");
    }
}
```

Interview point:

> Model output is not trusted. It is validated like user input.

## Tool Calling In Java

![Tool calling pattern](/img/diagrams/ai-tool-calling.svg)

Tool calling means the model can request a backend function, but Java executes
the function.

![Tool authorization GIF](/img/diagrams/tool-authorization.gif)

For Shopverse:

```text
User: Suggest gaming laptops under 50000
LLM: wants searchProducts(category=laptop, maxPrice=50000, keywords=[gaming])
Java: validates and calls inventory service
Inventory: returns real products
LLM or Java: formats final answer
```

Never let the LLM invent:

- SKU
- price
- stock
- payment status
- order status
- user permissions

## RAG In Java

RAG has two Java workflows.

Ingestion:

```text
read documents -> split into chunks -> create embeddings -> store vectors
```

Runtime:

```text
question -> create query embedding -> vector search -> prompt with chunks -> model answer
```

Java classes often map like this:

| Responsibility | Java class |
|---|---|
| read documents | `DocumentLoader`, file reader, DB reader |
| split text | `TextSplitter` or custom chunker |
| embed text | `EmbeddingModel` |
| store/search vectors | `VectorStore` or embedding store |
| build answer | `RagAnswerService` |

## Streaming

Streaming returns tokens gradually instead of waiting for the full answer.

Use streaming for:

- chat UI
- long responses
- better perceived latency

Avoid streaming when:

- you need strict JSON
- response must be validated before showing
- endpoint is internal service-to-service

For the Shopverse POC, streaming is optional.

## Security Checklist

| Risk | Control |
|---|---|
| API key leak | environment variables or secrets manager |
| prompt injection | never put secrets in prompts, validate tool calls |
| data leakage | filter documents by user/tenant/role |
| unauthorized order access | check ownership before tool calls |
| expensive endpoint abuse | authentication, rate limits, request size limits |
| sensitive logs | log IDs and metadata, not full prompts |

## Observability Checklist

Track:

- AI request count
- model latency
- provider errors
- token usage
- vector search duration
- retrieved chunk count
- fallback answer count
- tool call count

Interview line:

> I would monitor AI like any external dependency, but with extra AI-specific
> metrics such as token usage, retrieved chunk count, and fallback rate.

## What To Master Quickly

| Priority | Topic | Why |
|---|---|---|
| P0 | simple chat API | baseline integration |
| P0 | RAG flow | most common enterprise AI pattern |
| P0 | embeddings/vector DB | core of retrieval |
| P0 | structured output | makes AI useful in backend workflows |
| P1 | tool calling | prevents hallucinated business data |
| P1 | Spring AI `ChatClient` and `VectorStore` | direct fit for Spring Boot |
| P1 | LangChain4j AI Services | useful Java abstraction |
| P2 | streaming | useful for UI but not mandatory |
| P2 | memory | useful for chatbots but not first POC requirement |
