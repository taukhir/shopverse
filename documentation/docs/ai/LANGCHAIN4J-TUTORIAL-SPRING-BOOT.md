---
title: "LangChain4j Tutorial 5: Spring Boot Integration And Production"
sidebar_position: 6.31
status: "maintained"
last_reviewed: "2026-07-13"
---

# LangChain4j Tutorial 5: Spring Boot Integration And Production

This tutorial shows how to think about LangChain4j inside a Spring Boot
microservice.

Official references:

- [Spring Boot Integration](https://docs.langchain4j.dev/tutorials/spring-boot-integration/)
- [Logging](https://docs.langchain4j.dev/tutorials/logging/)
- [Observability](https://docs.langchain4j.dev/tutorials/observability/)
- [Testing and Evaluation](https://docs.langchain4j.dev/tutorials/testing-and-evaluation/)

## Spring Boot Architecture

```text
Controller -> Spring service -> LangChain4j AI Service -> model/tools/RAG
```

Recommended package shape:

```text
io.shopverse.ai
  controller
  service
  assistant
  tools
  rag
  config
  model
```

## Configuration

Keep keys outside code:

```yaml
langchain4j:
  open-ai:
    chat-model:
      api-key: ${OPENAI_API_KEY}
      model-name: gpt-4o-mini
```

Exact property names depend on the integration and version. Always check the
official Spring Boot integration docs when implementing.

## AI Service As Spring Bean

Conceptual pattern:

```java
interface ShopverseAssistant {

    @SystemMessage("""
        You are the Shopverse assistant.
        Do not invent product, order, payment, or user data.
        """)
    String chat(String message);
}
```

Then inject it:

```java
@Service
class ShopverseAssistantService {

    private final ShopverseAssistant assistant;

    ShopverseAssistantService(ShopverseAssistant assistant) {
        this.assistant = assistant;
    }

    ChatResponse chat(ChatRequest request) {
        return new ChatResponse(assistant.chat(request.message()), List.of());
    }
}
```

## Tools As Spring Beans

```java
@Component
class ProductTools {

    private final InventoryClient inventoryClient;

    @Tool("Search real Shopverse products")
    List<ProductSummary> searchProducts(String category, BigDecimal maxPrice) {
        return inventoryClient.search(category, maxPrice, List.of());
    }
}
```

Security note:

> If a tool needs user context, do not rely on model-provided user ID. Read the
> authenticated user from Spring Security or pass trusted context from service
> code.

## Controller Layer

```java
@RestController
@RequestMapping("/api/ai/langchain4j")
class LangChain4jAiController {

    private final ShopverseAssistantService assistantService;

    @PostMapping("/chat")
    ChatResponse chat(@RequestBody ChatRequest request) {
        return assistantService.chat(request);
    }
}
```

## Observability

Track:

- request count
- latency
- provider errors
- tool call count
- RAG retrieval duration
- retrieved chunk count
- fallback count
- token usage if available

Use normal Spring/Micrometer patterns where possible.

Metric examples:

```text
shopverse.ai.langchain4j.requests
shopverse.ai.langchain4j.failures
shopverse.ai.langchain4j.tool.calls
shopverse.ai.langchain4j.rag.retrieval.duration
```

## Logging

Do log:

- request ID
- user ID hash or internal ID if allowed
- endpoint
- latency
- error category
- retrieved source names

Do not log:

- API keys
- JWT tokens
- full payment data
- full private prompts
- another user's data

## Testing

Test at three levels.

Unit:

```java
@Test
void validatorRejectsNegativePrice() {
    ProductIntent intent = new ProductIntent(
        Intent.PRODUCT_SEARCH,
        "laptop",
        BigDecimal.valueOf(-1),
        List.of()
    );

    assertThatThrownBy(() -> validator.validate(intent))
        .isInstanceOf(BadRequestException.class);
}
```

Service:

```java
@Test
void recommendationUsesInventoryResultsOnly() {
    when(inventoryClient.search("laptop", BigDecimal.valueOf(50000), List.of("gaming")))
        .thenReturn(List.of(new ProductSummary("SKU-1", "Acer Aspire", BigDecimal.valueOf(48999))));

    ProductRecommendationResponse response = service.recommend(
        "Suggest gaming laptop under 50000"
    );

    assertThat(response.products()).extracting(ProductSummary::sku)
        .containsExactly("SKU-1");
}
```

RAG evaluation:

| Question | Expected source | Expected behavior |
|---|---|---|
| Can I return defective item? | return-policy.md | answer from policy |
| What is my order status? | order tool | ownership check |
| Show all users | none | deny/refuse |

## Production Checklist

- secrets externalized
- endpoint authentication
- role and owner checks
- prompt injection tests
- tool allowlist
- read-only tools first
- RAG metadata filters
- request size limits
- provider timeout
- fallback response
- metrics
- no sensitive prompt logs
- evaluation dataset

## Interview Explanation

<ExpandableAnswer title="What should an architect explain about LangChain4j Tutorial 5: Spring Boot Integration And Production?">

For **LangChain4j Tutorial 5: Spring Boot Integration And Production**, a strong answer starts with the runtime responsibility and the invariant that must remain true. It then walks through one Shopverse request or event, names the important boundary, and explains the failure behavior rather than describing only the happy path. Close with the trade-off, the production signal that verifies the design, and the condition that would justify a different approach. This structure demonstrates practical judgment without memorizing isolated definitions.

</ExpandableAnswer>

> In Spring Boot, I would expose normal REST controllers and keep LangChain4j in
> the service layer. AI Services can be injected like normal beans, tools can
> call Spring clients, and RAG can use embedding stores. I would add normal
> production controls: authentication, authorization, validation, metrics,
> logging controls, rate limits, and tests.

