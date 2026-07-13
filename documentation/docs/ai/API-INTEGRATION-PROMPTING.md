---
title: API Integration And Prompting
sidebar_position: 4
status: "maintained"
last_reviewed: "2026-07-13"
---

# API Integration And Prompting

![Prompt lifecycle](/img/diagrams/ai-prompt-lifecycle.svg)

## Where AI Fits In A Spring Boot App

Keep the application architecture familiar. The AI provider is an external
dependency, similar to a payment gateway or notification provider.

## Basic AI API Flow

```text
Client
  -> Spring Boot controller
  -> service validates request
  -> AI client calls model provider
  -> service parses response
  -> controller returns API response
```

In Java, keep AI calls inside a service class. Do not call AI providers directly
from controllers.

Suggested package shape for a POC:

```text
io.shopverse.ai
  controller
    AiChatController
  service
    AiChatService
    RagService
    ProductRecommendationService
  model
    ChatRequest
    ChatResponse
    ProductIntent
    SourceChunk
  config
    AiClientConfig
```

## Configuration

Keep provider configuration external:

```yaml
spring:
  ai:
    openai:
      api-key: ${OPENAI_API_KEY}
```

Rules:

- never commit real API keys
- use environment variables
- set timeout values
- handle provider errors
- log request IDs, not full prompts with sensitive data

## Provider Error Handling

| Failure | Example | Backend behavior |
|---|---|---|
| Authentication | invalid API key | return 503 or internal integration error |
| Rate limit | too many requests | return retry-friendly message |
| Timeout | model took too long | return controlled fallback |
| Invalid output | malformed JSON | retry once or return validation error |
| Safety refusal | provider blocks response | show safe generic message |
| Network failure | provider unreachable | circuit breaker or graceful failure |

## Prompt Parts

| Part | Purpose |
|---|---|
| System prompt | Defines role, rules, constraints, output format |
| User prompt | Actual user request |
| Context | Retrieved documents, product data, policy text |
| Examples | Optional examples of expected behavior |

## Prompting Rules For Backend Developers

| Rule | Why |
|---|---|
| Put stable rules in the system prompt | keeps behavior consistent |
| Put user text in a clearly marked section | reduces instruction confusion |
| Ask for a strict output schema when needed | makes parsing safer |
| Keep prompts short but explicit | lowers cost and confusion |
| Tell the model what to do when data is missing | reduces hallucination |
| Do not include secrets | prompts may be logged or inspected |

## Good Prompt For Grounded Q&A

```text
You are the Shopverse assistant.
Answer only using the provided context.
If the context does not contain the answer, say: "I do not know from the provided Shopverse documents."
Keep the answer short and practical.

Context:
{retrieved_context}

Question:
{user_question}
```

Expected answer behavior:

| Context status | Correct response |
|---|---|
| relevant context found | answer and cite source |
| partial context found | answer only supported part |
| no context found | say the answer is not in documents |
| user asks unrelated question | redirect or return unknown |

## Good Prompt For JSON Extraction

```text
Extract product search intent from the user message.
Return only valid JSON with this schema:
{
  "intent": "PRODUCT_SEARCH" | "POLICY_QUESTION" | "ORDER_STATUS" | "UNKNOWN",
  "category": string | null,
  "maxPrice": number | null,
  "keywords": string[]
}

User message:
{message}
```

## Java DTOs For Structured Output

Example Java record shape:

```java
public record ProductIntent(
    String intent,
    String category,
    BigDecimal maxPrice,
    List<String> keywords
) {}
```

Validation rules:

- `intent` must be one of the allowed values
- `maxPrice` must be positive when present
- `keywords` should have a reasonable max size
- unknown category should not break the API
- invalid JSON should not call downstream services

## API Integration Concerns

| Concern | What to do |
|---|---|
| Timeout | Set connection and read timeout |
| Retry | Retry transient 429/5xx carefully |
| Rate limit | Return friendly error or queue request |
| Cost | Limit max tokens and context size |
| Security | Remove secrets and sensitive user data |
| Validation | Validate JSON output before using it |
| Observability | Track latency, failure rate, token usage |

## Structured Output

For backend systems, structured output is safer than free text when the result
will drive application behavior.

Example:

```json
{
  "intent": "PRODUCT_SEARCH",
  "category": "laptop",
  "maxPrice": 50000,
  "keywords": ["gaming", "ssd"]
}
```

The backend should still validate this before querying a database.

## Prompt Examples For Shopverse

### Classification

```text
Classify the user message into exactly one intent:
POLICY_QUESTION, PRODUCT_SEARCH, ORDER_STATUS, PAYMENT_HELP, UNKNOWN.
Return only the intent.

Message:
{message}
```

### Summarization

```text
Summarize these product reviews in 4 bullet points.
Mention common positives, common complaints, and whether the tone is mostly positive.

Reviews:
{reviews}
```

### Customer-Safe Explanation

```text
Convert this internal order status into a customer-friendly message.
Do not mention internal service names, Kafka, database tables, or stack traces.

Status:
{order_status}
```

## API Design Checklist

| Item | Reason |
|---|---|
| request size limit | avoid huge prompts and cost spikes |
| authentication | AI endpoints can be expensive |
| authorization | user can only ask about their own order |
| timeout | model APIs can be slow |
| retry policy | transient provider errors happen |
| metrics | track latency, errors, and cost |
| audit fields | debug without logging sensitive prompts |
| validation | never trust model output blindly |

## Interview Explanation

<ExpandableAnswer title="What should an architect explain about API Integration And Prompting?">

For **API Integration And Prompting**, a strong answer starts with the runtime responsibility and the invariant that must remain true. It then walks through one Shopverse request or event, names the important boundary, and explains the failure behavior rather than describing only the happy path. Close with the trade-off, the production signal that verifies the design, and the condition that would justify a different approach. This structure demonstrates practical judgment without memorizing isolated definitions.

</ExpandableAnswer>

> In Java, I would isolate AI provider calls in a service layer, configure API
> keys through environment variables, set timeouts and retries, validate
> structured output, and use normal backend observability for latency, errors,
> and cost.
