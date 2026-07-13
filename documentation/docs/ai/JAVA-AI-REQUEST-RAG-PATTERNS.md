---
title: "Java AI Request And RAG Patterns"
description: "Java AI Request And RAG Patterns with Shopverse examples, failure analysis, and production guidance."
sidebar_label: "Java AI Request And RAG Patterns"
tags: ["shopverse", "architecture", "production"]
page_type: "Guide"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# Java AI Request And RAG Patterns

<DocLabels items={[{label: 'Advanced', tone: 'advanced'}, {label: 'Shopverse', tone: 'shopverse'}, {label: 'Production', tone: 'production'}]} />

## 1. Request And Response DTOs

```java
public record ChatRequest(String message) {}

public record ChatResponse(
    String answer,
    List<String> sources
) {}
```

For product intent:

```java
public enum AiIntent {
    PRODUCT_SEARCH,
    POLICY_QUESTION,
    ORDER_STATUS,
    UNKNOWN
}

public record ProductIntent(
    AiIntent intent,
    String category,
    BigDecimal maxPrice,
    List<String> keywords
) {}
```

## 2. Controller Pattern

```java
@RestController
@RequestMapping("/api/ai")
class AiController {

    private final AiChatService chatService;
    private final RagAnswerService ragAnswerService;

    AiController(AiChatService chatService, RagAnswerService ragAnswerService) {
        this.chatService = chatService;
        this.ragAnswerService = ragAnswerService;
    }

    @PostMapping("/chat")
    ChatResponse chat(@RequestBody ChatRequest request) {
        return chatService.chat(request);
    }

    @PostMapping("/rag/ask")
    ChatResponse ask(@RequestBody ChatRequest request) {
        return ragAnswerService.answer(request);
    }
}
```

Rule:

```text
Controller handles HTTP. Service handles AI flow.
```

## 3. Spring AI ChatClient

```java
@Service
class AiChatService {

    private final ChatClient chatClient;

    AiChatService(ChatClient.Builder builder) {
        this.chatClient = builder
            .defaultSystem("""
                You are the Shopverse assistant.
                Answer clearly and do not invent business data.
                """)
            .build();
    }

    ChatResponse chat(ChatRequest request) {
        String answer = chatClient.prompt()
            .user(request.message())
            .call()
            .content();

        return new ChatResponse(answer, List.of());
    }
}
```

## 4. Spring AI Structured Output

Conceptual pattern:

```java
@Service
class IntentExtractionService {

    private final ChatClient chatClient;

    ProductIntent extract(String message) {
        ProductIntent intent = chatClient.prompt()
            .system("""
                Extract product search intent.
                Return only structured data matching ProductIntent.
                """)
            .user(message)
            .call()
            .entity(ProductIntent.class);

        validate(intent);
        return intent;
    }

    private void validate(ProductIntent intent) {
        if (intent.intent() == null) {
            throw new IllegalArgumentException("Missing intent");
        }
        if (intent.maxPrice() != null && intent.maxPrice().signum() < 0) {
            throw new IllegalArgumentException("Invalid max price");
        }
    }
}
```

Interview point:

> Structured output reduces parsing risk, but validation is still required.

## 5. Spring AI Manual RAG

```java
@Service
class RagAnswerService {

    private final VectorStore vectorStore;
    private final ChatClient chatClient;

    ChatResponse answer(ChatRequest request) {
        List<Document> chunks = vectorStore.similaritySearch(
            SearchRequest.query(request.message()).withTopK(5)
        );

        if (chunks.isEmpty()) {
            return new ChatResponse(
                "I do not know from the provided Shopverse documents.",
                List.of()
            );
        }

        String context = chunks.stream()
            .map(Document::getText)
            .collect(Collectors.joining("\n\n"));

        String answer = chatClient.prompt()
            .user(buildPrompt(request.message(), context))
            .call()
            .content();

        List<String> sources = chunks.stream()
            .map(doc -> String.valueOf(doc.getMetadata().get("source")))
            .distinct()
            .toList();

        return new ChatResponse(answer, sources);
    }

    private String buildPrompt(String question, String context) {
        return """
            You are the Shopverse assistant.
            Answer only from the context.
            If the answer is missing, say you do not know from the provided documents.

            Context:
            %s

            Question:
            %s
            """.formatted(context, question);
    }
}
```

## 6. Document Chunk Model

```java
public record SourceChunk(
    String id,
    String content,
    String source,
    String section,
    Map<String, Object> metadata
) {}
```

Metadata matters:

```java
Map<String, Object> metadata = Map.of(
    "source", "return-policy.md",
    "section", "Defective products",
    "visibility", "PUBLIC",
    "documentType", "POLICY"
);
```

## 7. Product Recommendation Flow

```java
@Service
class ProductRecommendationService {

    private final IntentExtractionService intentExtractionService;
    private final InventoryClient inventoryClient;
    private final ChatClient chatClient;

    ProductRecommendationResponse recommend(String message) {
        ProductIntent intent = intentExtractionService.extract(message);

        if (intent.intent() != AiIntent.PRODUCT_SEARCH) {
            return ProductRecommendationResponse.empty("No product search intent found.");
        }

        List<ProductSummary> products = inventoryClient.search(
            intent.category(),
            intent.maxPrice(),
            intent.keywords()
        );

        String answer = chatClient.prompt()
            .user(buildRecommendationPrompt(message, products))
            .call()
            .content();

        return new ProductRecommendationResponse(answer, products);
    }
}
```

Rule:

```text
LLM extracts intent. Inventory service returns real products.
```

## 8. LangChain4j AI Service

```java
interface ShopverseAssistant {

    @SystemMessage("""
        You are the Shopverse assistant.
        Do not invent product, order, payment, or stock data.
        """)
    String chat(String userMessage);
}
```

Conceptual creation:

```java
ShopverseAssistant assistant = AiServices.builder(ShopverseAssistant.class)
    .chatModel(chatModel)
    .build();
```

## 9. LangChain4j Structured Output

```java
interface IntentExtractor {

    @SystemMessage("""
        Extract the user's intent.
        Return a ProductIntent object.
        """)
    ProductIntent extract(String message);
}
```

## Recommended Next

Return to [Java AI Code Cookbook](./JAVA-AI-CODE-COOKBOOK.md) to select the next focused guide.


## Reading Strategy

Use **Java AI Request And RAG Patterns** as a decision and verification guide inside **Java AI Code Cookbook**. Start by naming the invariant or operational outcome, then follow the runtime flow and identify the owning component. For every example, record the expected success evidence, the most important failure mode, and the metric or test that proves recovery. This keeps the material useful for implementation reviews, production incidents, and architect interviews instead of treating it as isolated syntax.

Within **Java AI Request And RAG Patterns**, apply the Shopverse guidance incrementally: verify the current behavior, introduce one bounded change, test the unhappy path, and preserve a rollback or reconciliation route. Follow links to canonical pages when a concept belongs to another track; do not copy that explanation into this page. This ownership rule keeps the focused guides short while retaining technical depth and traceability.

## Official References

- [LangChain4j documentation](https://docs.langchain4j.dev/)
- [Spring AI reference](https://docs.spring.io/spring-ai/reference/)
