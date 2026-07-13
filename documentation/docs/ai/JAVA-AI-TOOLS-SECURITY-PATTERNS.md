---
title: "Java AI Tools And Security Patterns"
description: "Java AI Tools And Security Patterns with Shopverse examples, failure analysis, and production guidance."
sidebar_label: "Java AI Tools And Security Patterns"
tags: ["shopverse", "architecture", "production"]
page_type: "Guide"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# Java AI Tools And Security Patterns

<DocLabels items={[{label: 'Advanced', tone: 'advanced'}, {label: 'Shopverse', tone: 'shopverse'}, {label: 'Production', tone: 'production'}]} />

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

## Recommended Next

Return to [Java AI Code Cookbook](./JAVA-AI-CODE-COOKBOOK.md) to select the next focused guide.


## Reading Strategy

Use **Java AI Tools And Security Patterns** as a decision and verification guide inside **Java AI Code Cookbook**. Start by naming the invariant or operational outcome, then follow the runtime flow and identify the owning component. For every example, record the expected success evidence, the most important failure mode, and the metric or test that proves recovery. This keeps the material useful for implementation reviews, production incidents, and architect interviews instead of treating it as isolated syntax.

Within **Java AI Tools And Security Patterns**, apply the Shopverse guidance incrementally: verify the current behavior, introduce one bounded change, test the unhappy path, and preserve a rollback or reconciliation route. Follow links to canonical pages when a concept belongs to another track; do not copy that explanation into this page. This ownership rule keeps the focused guides short while retaining technical depth and traceability.

## Official References

- [LangChain4j documentation](https://docs.langchain4j.dev/)
- [Spring AI reference](https://docs.spring.io/spring-ai/reference/)
