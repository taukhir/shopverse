---
title: LangChain4j Deep Dive
sidebar_position: 6.3
---

# LangChain4j Deep Dive

LangChain4j is a Java library for building LLM-powered applications. It is
especially useful to understand because it gives Java-friendly abstractions such
as AI Services, tools, memory, structured outputs, and retrieval augmentors.

Official references:

- [LangChain4j tutorials](https://docs.langchain4j.dev/category/tutorials/)
- [AI Services](https://docs.langchain4j.dev/tutorials/ai-services/)
- [Tools](https://docs.langchain4j.dev/tutorials/tools/)
- [RAG](https://docs.langchain4j.dev/tutorials/rag/)

## Why LangChain4j Exists

The official introduction explains the core goal clearly: simplify integrating
LLMs into Java applications.

The problem is that every model provider and vector store has its own API. If
your code directly depends on one provider's request/response shape, switching
providers becomes painful.

LangChain4j solves this with:

| Goal | Meaning |
|---|---|
| unified APIs | use common Java abstractions across providers and embedding stores |
| comprehensive toolbox | common LLM patterns are available as reusable components |
| examples | many examples help developers start quickly |

For Shopverse:

```text
Shopverse service code should not care deeply whether the model is OpenAI,
Ollama, Gemini, or another provider.
```

## Not A Python LangChain Port

The intro explicitly says LangChain4j is not a Java port of Python LangChain.
It is designed around Java conventions:

- type safety
- POJOs
- annotations
- interfaces
- dependency injection
- fluent APIs
- Spring Boot and other Java framework integrations

Interview line:

> LangChain4j borrows the general idea of LLM application building blocks, but
> it is written idiomatically for Java instead of being a direct Python port.

## Feature Map

LangChain4j covers a broad set of LLM app features:

| Feature | What it gives you |
|---|---|
| LLM provider integrations | connect to many chat model providers |
| embedding model integrations | create vectors from text |
| embedding/vector stores | store and search embeddings |
| chat memory stores | keep conversation state |
| prompt templates | reusable prompts |
| streaming | incremental model responses |
| output parsers | convert output to Java types and POJOs |
| tools/function calling | call Java methods from model flow |
| RAG ingestion | load, split, embed, and store documents |
| RAG retrieval | query transformation, routing, retrieval, reranking |
| agents | multi-step model/tool workflows |
| moderation | unsafe-content checks where supported |

Do not try to master all features first. Start with AI Services, structured
outputs, tools, and RAG.

## Low-Level vs High-Level API

![AI framework abstraction levels](/img/diagrams/ai-abstraction-levels.svg)

LangChain4j has two practical levels.

Low-level:

```text
ChatModel
UserMessage
AiMessage
EmbeddingModel
EmbeddingStore
```

Use this when you want full control.

High-level:

```text
AI Services
```

Use this when you want a Java interface backed by a model, memory, tools, RAG,
and structured output handling.

Example mapping:

| Need | Low-level | High-level |
|---|---|---|
| simple model call | `ChatModel` | AI Service method |
| typed output | manual parse/output parser | Java return type |
| tools | manual tool execution | `@Tool` methods |
| RAG | manual retrieval | `RetrievalAugmentor` |
| memory | manual memory handling | AI Service memory |

## Library Structure Mental Model

The official intro describes a modular design:

| Module family | Purpose |
|---|---|
| core | core abstractions and APIs |
| main library | useful tools, document loaders, memory, AI Services |
| integrations | provider-specific and vector-store-specific modules |

Practical meaning:

```text
Use core abstractions in your code.
Swap integration modules when provider or vector store changes.
```

## What LangChain4j Is

LangChain4j helps Java developers compose LLM applications from components:

- chat models
- chat messages
- memory
- prompt templates
- output parsers
- tools
- embedding models
- embedding stores
- retrieval augmentors

Its tutorial describes AI Services as a high-level concept that hides LLM
complexity behind a simple Java API, similar in spirit to Spring Data JPA or
Retrofit.

## Main Mental Model

```text
Java interface
  -> LangChain4j AI Service proxy
  -> model, memory, tools, RAG, output parsing
  -> Java return value
```

Example:

```java
interface Assistant {
    String chat(String userMessage);
}
```

LangChain4j can create an implementation of this interface backed by a model.

## AI Services

AI Services are one of the most important LangChain4j ideas.

They help with:

- formatting inputs for the LLM
- parsing outputs from the LLM
- integrating chat memory
- integrating tools
- integrating RAG
- returning structured outputs

Simple shape:

```java
interface ShopverseAssistant {
    String chat(String userMessage);
}
```

Conceptual creation:

```java
ShopverseAssistant assistant = AiServices
    .builder(ShopverseAssistant.class)
    .chatModel(chatModel)
    .build();
```

In Spring Boot integrations, the framework can create beans for AI Services, so
you inject the interface like any other service.

## System And User Messages

LangChain4j supports annotations for prompts.

Example:

```java
interface ShopverseAssistant {

    @SystemMessage("""
        You are the Shopverse assistant.
        Answer clearly and do not invent business data.
        """)
    String chat(String userMessage);
}
```

You can also use `@UserMessage` templates:

```java
interface PolicyAssistant {

    @UserMessage("""
        Answer this policy question using the supplied context.

        Question: {{question}}
        Context: {{context}}
        """)
    String answer(@V("question") String question, @V("context") String context);
}
```

## Chat Models

`ChatModel` is the low-level model abstraction.

Mental model:

```text
ChatModel accepts messages and returns model response.
AI Service wraps ChatModel into a Java interface.
```

Use low-level model APIs when:

- you need full control
- you are building framework-level components
- you want to inspect every request/response

Use AI Services when:

- you want business-friendly Java interfaces
- you need tools, memory, and RAG wired cleanly
- you want typed outputs

## Structured Outputs

LangChain4j AI Service methods can return structured types instead of plain
strings.

Example:

```java
enum Intent {
    PRODUCT_SEARCH,
    POLICY_QUESTION,
    ORDER_STATUS,
    UNKNOWN
}

record ProductIntent(
    Intent intent,
    String category,
    BigDecimal maxPrice,
    List<String> keywords
) {}

interface IntentExtractor {
    ProductIntent extract(String userMessage);
}
```

Interview point:

> Structured output lets Java code receive typed results, but I still validate
> the result before calling downstream services.

## Tools

![Tool calling pattern](/img/diagrams/ai-tool-calling.svg)

Tools let the model request Java methods.

Example:

```java
class ProductTools {

    private final InventoryClient inventoryClient;

    @Tool("Search Shopverse products using validated filters")
    List<ProductSummary> searchProducts(String category, BigDecimal maxPrice) {
        return inventoryClient.search(category, maxPrice);
    }
}
```

AI Service wiring:

```java
ShopverseAssistant assistant = AiServices
    .builder(ShopverseAssistant.class)
    .chatModel(chatModel)
    .tools(new ProductTools(inventoryClient))
    .build();
```

Important notes from the official tools tutorial:

- `@Tool` can define tool name and description
- tool methods can have parameters
- tool discovery/search can be configured for larger tool sets
- some tools can return immediately instead of sending the result back to the LLM

Interview line:

> Tools are how the LLM connects to real Java code, but Java still controls
> validation, authorization, and execution.

## Tool Safety Rules

| Rule | Reason |
|---|---|
| validate arguments | model can produce invalid parameters |
| check authorization | model must not bypass security |
| limit tool list | too many tools increase confusion and tokens |
| avoid destructive tools initially | reduce risk |
| log tool name and status | debug and audit |
| return controlled errors | model can recover or fallback |

Shopverse examples:

| Tool | Safe? | Notes |
|---|---|---|
| `searchProducts` | yes | read-only |
| `getReturnPolicy` | yes | read-only |
| `getOrderStatus` | yes with ownership check | must check user |
| `cancelOrder` | risky | avoid in first POC |
| `issueRefund` | risky | do not expose to LLM in basic POC |

## Memory

Memory stores selected conversation messages.

Example:

```text
User: Show me gaming laptops.
Assistant: Here are options.
User: Only under 50000.
```

The second user message depends on the first. Memory helps the model understand
the follow-up.

Rules:

- scope by conversation ID
- scope by user ID
- cap number of messages
- avoid storing sensitive data
- do not confuse memory with RAG

## RAG In LangChain4j

![RAG flow](/img/diagrams/ai-rag-flow.svg)

LangChain4j's RAG tutorial describes `RetrievalAugmentor` as the entry point
into the RAG pipeline. It augments a chat message with relevant content
retrieved from sources.

Conceptual flow:

```text
AI Service invocation
  -> RetrievalAugmentor
  -> ContentRetriever
  -> EmbeddingStore
  -> relevant content
  -> model prompt
```

Example structure:

```java
RetrievalAugmentor retrievalAugmentor =
    DefaultRetrievalAugmentor.builder()
        .contentRetriever(
            EmbeddingStoreContentRetriever.from(embeddingStore, embeddingModel))
        .build();

Assistant assistant = AiServices.builder(Assistant.class)
    .chatModel(chatModel)
    .retrievalAugmentor(retrievalAugmentor)
    .build();
```

## Embedding Stores

LangChain4j uses embedding stores for vector storage.

Responsibilities:

- store text segments and embeddings
- search similar segments
- return content for RAG

For Shopverse:

```text
return-policy.md -> text segments -> embeddings -> embedding store
```

## Result Metadata

LangChain4j AI Services can return richer result wrappers with metadata such as:

- token usage
- retrieved sources
- tool executions
- finish reason
- intermediate responses

This is useful for debugging and observability.

## LangChain4j With Spring Boot

LangChain4j has Spring Boot integration, so you can use it in Spring apps.

Possible Shopverse use:

```text
ai-service
  -> LangChain4j AI Service interface
  -> ProductTools
  -> RetrievalAugmentor
  -> Qdrant or PGVector embedding store
```

However, if the interview is Spring-heavy, Spring AI is usually easier to
justify first.

## What To Master First

| Priority | LangChain4j topic |
|---|---|
| P0 | AI Services |
| P0 | `@SystemMessage` and `@UserMessage` |
| P0 | structured return types |
| P1 | tools with `@Tool` |
| P1 | memory basics |
| P1 | `RetrievalAugmentor` |
| P2 | tool search |
| P2 | result metadata |
| P2 | streaming |

## Interview Q&A

### What is LangChain4j?

LangChain4j is a Java library for building LLM applications. It provides
abstractions for chat models, AI Services, memory, tools, structured outputs,
embedding stores, and RAG.

### What are AI Services?

AI Services let you define a Java interface, and LangChain4j creates a proxy
implementation backed by an LLM and optional memory, tools, RAG, and output
parsing.

### What is `RetrievalAugmentor`?

It is the entry point into LangChain4j's RAG pipeline. It augments a user
message with relevant retrieved content before the model answers.

### What is `@Tool`?

`@Tool` marks a Java method as callable by the model. The model can request the
tool, but Java executes the method and controls validation and authorization.

### When would you choose LangChain4j?

I would choose it when I want interface-driven AI services, strong tool
patterns, and a Java library that is not tied only to Spring AI abstractions.
