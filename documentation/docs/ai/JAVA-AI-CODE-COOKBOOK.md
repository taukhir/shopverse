---
title: Java AI Code Cookbook
sidebar_position: 6.5
---

# Java AI Code Cookbook

These snippets are intentionally framework-oriented and interview-friendly.
Use them as patterns, not copy-paste production code.

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

## 10. LangChain4j Tool

```java
class ProductTools {

    private final InventoryClient inventoryClient;

    @Tool("Search real Shopverse products by category and maximum price")
    List<ProductSummary> searchProducts(String category, BigDecimal maxPrice) {
        if (maxPrice != null && maxPrice.signum() < 0) {
            throw new IllegalArgumentException("Invalid max price");
        }
        return inventoryClient.search(category, maxPrice, List.of());
    }
}
```

## 11. LangChain4j RAG Shape

```java
RetrievalAugmentor retrievalAugmentor =
    DefaultRetrievalAugmentor.builder()
        .contentRetriever(
            EmbeddingStoreContentRetriever.from(embeddingStore, embeddingModel)
        )
        .build();

ShopverseAssistant assistant = AiServices.builder(ShopverseAssistant.class)
    .chatModel(chatModel)
    .retrievalAugmentor(retrievalAugmentor)
    .build();
```

## 12. Error Handling Pattern

```java
try {
    return aiService.chat(request);
} catch (AiProviderTimeoutException ex) {
    log.warn("AI provider timeout requestId={}", requestId);
    return fallbackResponse();
} catch (InvalidModelOutputException ex) {
    log.warn("Invalid AI output requestId={}", requestId);
    return fallbackResponse();
}
```

Do not log:

```text
API keys
JWT tokens
full customer data
sensitive prompts
```

## 13. Prompt Test Pattern

```java
@Test
void productIntentPromptExtractsLaptopBudget() {
    ProductIntent intent = intentExtractor.extract(
        "Suggest a gaming laptop under 50000"
    );

    assertThat(intent.intent()).isEqualTo(AiIntent.PRODUCT_SEARCH);
    assertThat(intent.category()).isEqualTo("laptop");
    assertThat(intent.maxPrice()).isEqualByComparingTo("50000");
}
```

For real tests, use provider stubs or recorded responses where possible.

## 14. Authorization-Aware RAG Filter

```java
public record AiPrincipal(
    String userId,
    String tenantId,
    Set<String> roles
) {}
```

```java
class AiRetrievalSecurity {

    String filterFor(AiPrincipal principal) {
        if (principal.roles().contains("ADMIN")) {
            return """
                tenantId == '%s' &&
                (visibility == 'PUBLIC' || visibility == 'ADMIN')
                """.formatted(principal.tenantId());
        }

        return """
            tenantId == '%s' &&
            (visibility == 'PUBLIC' || ownerId == '%s')
            """.formatted(principal.tenantId(), principal.userId());
    }
}
```

Usage:

```java
List<Document> chunks = vectorStore.similaritySearch(
    SearchRequest.query(question)
        .withTopK(5)
        .withFilterExpression(aiRetrievalSecurity.filterFor(principal))
);
```

Important:

```text
Never retrieve private chunks and hope the model ignores them.
```

## 15. Secure Tool Gateway

```java
class SecureProductTools {

    private final InventoryClient inventoryClient;

    List<ProductSummary> searchProducts(ProductIntent intent, Authentication auth) {
        if (!auth.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_CUSTOMER"))) {
            throw new AccessDeniedException("Only customers can search products");
        }

        if (intent.maxPrice() != null && intent.maxPrice().signum() < 0) {
            throw new IllegalArgumentException("Invalid max price");
        }

        return inventoryClient.search(
            intent.category(),
            intent.maxPrice(),
            intent.keywords()
        );
    }
}
```

## 16. Private Memory Key

```java
class AiMemoryKeyFactory {

    String key(Authentication auth, String tenantId, String conversationId) {
        return tenantId + ":" + auth.getName() + ":" + conversationId;
    }
}
```

Bad:

```text
conversationId only
```

Good:

```text
tenant + user + conversation
```

## 17. Abuse And Size Guard

```java
class AiRequestGuard {

    private static final int MAX_MESSAGE_LENGTH = 4000;

    void validate(ChatRequest request) {
        if (request.message() == null || request.message().isBlank()) {
            throw new BadRequestException("Message is required");
        }
        if (request.message().length() > MAX_MESSAGE_LENGTH) {
            throw new BadRequestException("Message is too long");
        }
        if (looksLikeCredentialDump(request.message())) {
            throw new BadRequestException("Sensitive data is not supported");
        }
    }
}
```

## 18. Safe Output Response

```java
class AiOutputGuard {

    ChatResponse safeResponse(String answer, List<String> sources) {
        String redacted = piiRedactor.redact(answer);
        String sanitized = htmlSanitizer.sanitize(redacted);
        return new ChatResponse(sanitized, sources);
    }
}
```

Use this before returning model output to a browser UI.
