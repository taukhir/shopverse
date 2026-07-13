---
title: "LangChain4j Tools And Memory"
description: "LangChain4j Tools And Memory with Shopverse examples, failure analysis, and production guidance."
sidebar_label: "LangChain4j Tools And Memory"
tags: ["shopverse", "architecture", "production"]
page_type: "Guide"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# LangChain4j Tools And Memory

<DocLabels items={[{label: 'Advanced', tone: 'advanced'}, {label: 'Shopverse', tone: 'shopverse'}, {label: 'Production', tone: 'production'}]} />

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

## Recommended Next

Return to [LangChain4j Deep Dive](./LANGCHAIN4J-DEEP-DIVE.md) to select the next focused guide.


## Official References

- [LangChain4j documentation](https://docs.langchain4j.dev/)
- [Spring AI reference](https://docs.spring.io/spring-ai/reference/)
