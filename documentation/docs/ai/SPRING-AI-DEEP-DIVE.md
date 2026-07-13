---
title: Spring AI Deep Dive
sidebar_position: 6.2
status: "maintained"
last_reviewed: "2026-07-13"
---

# Spring AI Deep Dive

Spring AI is the primary recommendation for the Shopverse POC because this
project is already Spring Boot-based.

![Spring AI ChatClient flow](/img/diagrams/spring-ai-chatclient-flow.svg)

Official references:

- [Spring Generative AI overview](https://spring.io/ai/)
- [Spring AI project page](https://spring.io/projects/spring-ai/)
- [Spring AI reference documentation](https://docs.spring.io/spring-ai/reference/)

## What Spring AI Is

Spring AI is an application framework for AI engineering in the Spring
ecosystem. Its goal is to bring Spring design principles such as portability,
modularity, auto-configuration, and POJO-based application design to AI
applications.

The Spring project page summarizes the core challenge as connecting enterprise
data and APIs with AI models. That is exactly the Shopverse use case:

```text
Shopverse documents + Shopverse APIs + LLM provider = AI assistant
```

## Why Java Developers Should Care

Spring's Generative AI overview highlights that Java remains common in
enterprise systems and that teams want AI capabilities such as RAG and
multimodal use cases without switching platforms.

For interviews:

> Spring AI lets Java/Spring developers add AI capabilities using familiar
> Spring Boot patterns instead of rewriting the backend in Python.

## Core Spring AI Concepts

| Concept | What it means | Shopverse example |
|---|---|---|
| `ChatClient` | fluent API for chat model calls | `/api/ai/chat` |
| `EmbeddingModel` | creates vectors from text | embed policy chunks |
| `VectorStore` | stores/searches embeddings | PGVector policy search |
| Structured outputs | map model output to Java objects | `ProductIntent` |
| Tools/function calling | connect model to Java functions/APIs | inventory search |
| Advisors | reusable model-call behavior | memory or RAG advisor |
| Chat memory | conversation history support | support assistant follow-up |
| RAG | retrieve context before generation | policy Q&A |
| Observability | insights into AI operations | latency, errors, token usage |
| ETL/document ingestion | load and transform documents | ingest FAQ/policy docs |
| Evaluation | check generated content quality | detect unsupported answers |

## Spring AI Dependency Mental Model

In a Spring Boot app, dependencies typically come through starters.

Example choices:

```text
spring-ai-openai-spring-boot-starter
spring-ai-pgvector-store-spring-boot-starter
```

The exact artifact names can change across versions, so check the current
Spring AI docs or Spring Initializr when implementing.

## Configuration

Typical config:

```yaml
spring:
  ai:
    openai:
      api-key: ${OPENAI_API_KEY}
```

Rules:

- use environment variables
- never commit real keys
- isolate provider configuration in `ai-service`
- add timeouts and graceful fallback behavior

## ChatClient

`ChatClient` is the main fluent API for chat model calls.

Simple service shape:

```java
@Service
public class ShopverseChatService {

    private final ChatClient chatClient;

    public ShopverseChatService(ChatClient.Builder builder) {
        this.chatClient = builder
            .defaultSystem("You are the Shopverse assistant. Answer clearly.")
            .build();
    }

    public String chat(String message) {
        return chatClient
            .prompt()
            .user(message)
            .call()
            .content();
    }
}
```

Interview explanation:

> `ChatClient` is similar in style to Spring's fluent clients. It hides
> provider-specific HTTP details and lets the service focus on prompts and
> response handling.

## Prompt Structure In Spring AI

Use:

- default system prompt for stable assistant behavior
- user prompt for request-specific input
- retrieved context for RAG
- options for model parameters when needed

Example RAG prompt:

```java
String prompt = """
    You are the Shopverse assistant.
    Answer only from the context.
    If missing, say you do not know from the provided documents.

    Context:
    %s

    Question:
    %s
    """.formatted(context, question);
```

## EmbeddingModel

`EmbeddingModel` converts text to vectors.

Use it when:

- ingesting documents
- embedding user questions
- building semantic search

Mental model:

```text
String text -> EmbeddingModel -> float vector -> VectorStore
```

For interviews, you do not need to memorize vector dimensions. Know the flow and
why embeddings enable semantic search.

## VectorStore

`VectorStore` stores documents and embeddings and performs similarity search.

Shopverse RAG flow:

```text
Document chunks -> VectorStore.add(...)
Question -> VectorStore.similaritySearch(...)
Relevant chunks -> ChatClient prompt
```

What to store:

| Field | Purpose |
|---|---|
| content | actual chunk text |
| source | citation |
| section | better source display |
| document type | filter policy vs FAQ vs admin |
| visibility | prevent wrong audience retrieval |

## RAG With Spring AI

![RAG flow](/img/diagrams/ai-rag-flow.svg)

Basic manual RAG service:

```java
@Service
public class RagAnswerService {

    private final VectorStore vectorStore;
    private final ChatClient chatClient;

    public String answer(String question) {
        List<Document> documents = vectorStore.similaritySearch(question);
        String context = documents.stream()
            .map(Document::getText)
            .collect(Collectors.joining("\n\n"));

        return chatClient.prompt()
            .user(buildRagPrompt(question, context))
            .call()
            .content();
    }
}
```

Spring AI also has advisor APIs for recurring patterns such as retrieval and
memory. For learning, understand manual RAG first; then learn advisors as a way
to reuse the pattern.

## Advisors

Advisors encapsulate behavior around a model call. Think of them like reusable
interceptors for AI calls.

They can help with:

- adding retrieved context
- adding chat memory
- transforming requests/responses
- applying common AI patterns repeatedly

Interview line:

> Advisors avoid duplicating RAG or memory logic across multiple chat calls.

## Structured Outputs

Spring AI supports mapping model output to Java objects.

Use structured outputs for:

- intent extraction
- classification
- field extraction
- routing decisions

Example target:

```java
public record ProductIntent(
    String intent,
    String category,
    BigDecimal maxPrice,
    List<String> keywords
) {}
```

Prompt:

```text
Extract product search intent.
Return only JSON matching ProductIntent.
```

Backend still validates the result.

## Tools And Function Calling

Spring AI's Generative AI page explains tool/function calling as registering
your own functions so models can connect to external APIs and real-time data.

Shopverse tool examples:

| Tool | Backend action |
|---|---|
| `searchProducts` | call inventory service |
| `getOrderStatus` | call order service after ownership check |
| `getRefundPolicy` | retrieve policy docs |
| `calculateDeliveryEstimate` | call shipping logic |

Important rule:

```text
The model chooses or requests the tool; Java validates and executes it.
```

## Chat Memory

Memory is useful for follow-up questions:

```text
User: What is the return policy?
Assistant: ...
User: What about defective items?
```

Be careful:

- scope memory by user/session
- do not mix users
- avoid storing sensitive data unnecessarily
- summarize or limit memory to control tokens

For the first POC, RAG and product tools matter more than memory.

## Observability

Spring AI includes observability support for AI operations.

In Shopverse, track:

```text
shopverse.ai.requests
shopverse.ai.failures
shopverse.ai.provider.latency
shopverse.ai.rag.retrieval.latency
shopverse.ai.rag.chunk.count
shopverse.ai.tool.calls
```

Interview line:

> I would monitor model calls like external dependencies, plus AI-specific
> metrics such as token usage, retrieved chunks, and fallback rate.

## Spring AI Supported Areas To Remember

From the Spring AI project page, remember these feature categories:

- major model providers
- chat completion
- embeddings
- text-to-image
- audio transcription
- text-to-speech
- moderation
- structured outputs
- vector databases
- tools/function calling
- observability
- document ETL
- evaluation
- ChatClient
- advisors
- chat memory
- RAG
- Spring Boot auto-configuration and starters

Do not memorize every provider name. Understand the abstraction and portability
idea.

## Spring AI Shopverse POC Design

Recommended:

```text
ai-service
  -> Spring AI ChatClient
  -> Spring AI EmbeddingModel
  -> Spring AI VectorStore with PGVector
  -> Feign/WebClient calls to inventory and order services
```

Endpoints:

```http
POST /api/ai/chat
POST /api/ai/rag/ask
POST /api/ai/documents/ingest
POST /api/ai/products/recommend
```

## What To Master First

| Priority | Spring AI topic |
|---|---|
| P0 | `ChatClient` simple call |
| P0 | prompt structure |
| P0 | `EmbeddingModel` and `VectorStore` |
| P0 | manual RAG flow |
| P1 | structured outputs |
| P1 | tools/function calling |
| P1 | advisors |
| P2 | memory |
| P2 | streaming |
| P2 | evaluation |

## Interview Q&A

<ExpandableAnswer title="What is Spring AI?">

Spring AI is a Spring ecosystem framework for building AI applications. It
provides abstractions for chat models, embeddings, vector stores, RAG, tools,
structured outputs, memory, observability, and provider portability.

</ExpandableAnswer>
<ExpandableAnswer title="Why Spring AI for Shopverse?">

Shopverse is a Spring Boot microservice project. Spring AI lets us add AI using
the same dependency injection, configuration, service layer, and observability
style already used in the project.

</ExpandableAnswer>
<ExpandableAnswer title="What is ChatClient?">

`ChatClient` is Spring AI's fluent API for calling chat models. It lets us set
system and user prompts and call the model without writing provider-specific
HTTP code.

</ExpandableAnswer>
<ExpandableAnswer title="What is VectorStore?">

`VectorStore` abstracts vector database operations such as adding embedded
documents and searching similar documents during RAG.

</ExpandableAnswer>
<ExpandableAnswer title="What are advisors?">

Advisors are reusable components that can add behavior around model calls, such
as retrieval or memory, so that repeated AI patterns are not duplicated.

</ExpandableAnswer>