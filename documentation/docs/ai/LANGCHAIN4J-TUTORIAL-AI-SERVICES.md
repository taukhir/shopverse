---
title: "LangChain4j Tutorial 2: AI Services And Structured Outputs"
sidebar_position: 6.28
status: "maintained"
last_reviewed: "2026-07-13"
---

# LangChain4j Tutorial 2: AI Services And Structured Outputs

AI Services are the most important LangChain4j abstraction for Java developers.
They let you define a Java interface and let LangChain4j create an
implementation backed by an LLM.

Official references:

- [AI Services](https://docs.langchain4j.dev/tutorials/ai-services/)
- [Structured Outputs](https://docs.langchain4j.dev/tutorials/structured-outputs/)
- [Classification](https://docs.langchain4j.dev/tutorials/classification/)

## Why AI Services Exist

Low-level model calls require repeated boilerplate:

```text
build messages -> call model -> parse output -> map to Java type
```

AI Services hide much of that behind a normal Java interface:

```java
interface Assistant {
    String chat(String message);
}
```

Mental model:

```text
Java method call -> prompt/message generation -> LLM call -> output parsing -> Java return value
```

## Simple AI Service

```java
interface ShopverseAssistant {

    @SystemMessage("""
        You are the Shopverse assistant.
        Answer clearly and do not invent business data.
        """)
    String chat(String userMessage);
}
```

Conceptual wiring:

```java
ShopverseAssistant assistant = AiServices.builder(ShopverseAssistant.class)
    .chatModel(chatModel)
    .build();
```

Usage:

```java
String answer = assistant.chat("What is RAG?");
```

## Prompt Annotations

| Annotation | Purpose |
|---|---|
| `@SystemMessage` | stable role/rules |
| `@UserMessage` | user prompt template |
| `@V` | variable binding in prompt templates |

Example:

```java
interface PolicyAssistant {

    @SystemMessage("You answer only from provided Shopverse context.")
    @UserMessage("""
        Question:
        {{question}}

        Context:
        {{context}}
        """)
    String answer(@V("question") String question, @V("context") String context);
}
```

## Structured Output

Backend apps often need typed output, not free text.

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
```

AI Service:

```java
interface IntentExtractor {

    @SystemMessage("""
        Extract the user's intent for a Shopverse backend.
        Return a ProductIntent.
        If unsure, use UNKNOWN.
        """)
    ProductIntent extract(String message);
}
```

Usage:

```java
ProductIntent intent = intentExtractor.extract(
    "Suggest a gaming laptop under 50000"
);
```

Expected:

```json
{
  "intent": "PRODUCT_SEARCH",
  "category": "laptop",
  "maxPrice": 50000,
  "keywords": ["gaming"]
}
```

## Validation Is Still Required

Do not blindly trust typed output.

```java
class ProductIntentValidator {

    void validate(ProductIntent intent) {
        if (intent.intent() == null) {
            throw new BadRequestException("Missing intent");
        }
        if (intent.maxPrice() != null && intent.maxPrice().signum() < 0) {
            throw new BadRequestException("Invalid max price");
        }
    }
}
```

Interview point:

> Structured output improves safety, but model output is still untrusted input.

## Classification

Classification maps text to a small set of labels.

```java
enum SupportIntent {
    RETURN_POLICY,
    SHIPPING,
    PRODUCT_SEARCH,
    ORDER_STATUS,
    PAYMENT,
    UNKNOWN
}

interface SupportClassifier {
    SupportIntent classify(String message);
}
```

Use classification for routing:

```java
SupportIntent intent = classifier.classify(message);

return switch (intent) {
    case RETURN_POLICY, SHIPPING -> ragService.answer(message);
    case PRODUCT_SEARCH -> productRecommendationService.recommend(message);
    case ORDER_STATUS -> orderToolService.answer(message);
    default -> fallback();
};
```

## Shopverse Endpoint

```http
POST /api/ai/langchain4j/intent
```

Request:

```json
{
  "message": "Can you show gaming laptops under 50000?"
}
```

Response:

```json
{
  "intent": "PRODUCT_SEARCH",
  "category": "laptop",
  "maxPrice": 50000,
  "keywords": ["gaming"]
}
```

## Common Mistakes

| Mistake | Fix |
|---|---|
| using free text for routing | use enum/DTO output |
| trusting parsed output | validate it |
| too many labels | keep classification labels small |
| no fallback label | always include `UNKNOWN` |
| vague prompt | specify exact domain and allowed values |

## Interview Explanation

<ExpandableAnswer title="What should an architect explain about LangChain4j Tutorial 2: AI Services And Structured Outputs?">

For **LangChain4j Tutorial 2: AI Services And Structured Outputs**, a strong answer starts with the runtime responsibility and the invariant that must remain true. It then walks through one Shopverse request or event, names the important boundary, and explains the failure behavior rather than describing only the happy path. Close with the trade-off, the production signal that verifies the design, and the condition that would justify a different approach. This structure demonstrates practical judgment without memorizing isolated definitions.

</ExpandableAnswer>

> LangChain4j AI Services let me define a Java interface and let the framework
> connect it to an LLM. This is useful for Spring developers because the rest of
> the app can call a normal Java method. I use structured outputs for backend
> workflows like intent extraction, then validate the result before using it.

