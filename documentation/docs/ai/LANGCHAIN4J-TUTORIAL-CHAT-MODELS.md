---
title: "LangChain4j Tutorial 1: Chat Models And Messages"
sidebar_position: 6.27
status: "maintained"
last_reviewed: "2026-07-13"
---

# LangChain4j Tutorial 1: Chat Models And Messages

This tutorial starts with the low-level API. Even if you later use AI Services,
you should understand what happens underneath.

Official reference:

- [Chat and Language Models](https://docs.langchain4j.dev/tutorials/chat-and-language-models/)
- [Model Parameters](https://docs.langchain4j.dev/tutorials/model-parameters/)
- [Response Streaming](https://docs.langchain4j.dev/tutorials/response-streaming/)

## What Is A Chat Model?

A chat model accepts messages and returns an AI message.

Mental model:

```text
SystemMessage + UserMessage -> ChatModel -> AiMessage
```

In a backend app:

```text
REST request -> service builds messages -> chat model -> service returns DTO
```

## Messages

Common message types:

| Message | Meaning | Shopverse example |
|---|---|---|
| system | developer instruction | "You are the Shopverse assistant." |
| user | user's request | "Can I return a damaged item?" |
| assistant | model's previous reply | "Yes, defective products..." |
| tool result | backend result returned to model | inventory product list |

Why this matters:

> The model only sees the messages you send. It does not automatically know your
> database, codebase, logged-in user, or policies.

## Low-Level Chat Example

Conceptual LangChain4j shape:

```java
ChatModel model = OpenAiChatModel.builder()
    .apiKey(System.getenv("OPENAI_API_KEY"))
    .modelName("gpt-4o-mini")
    .build();

String answer = model.chat("Explain RAG in simple terms.");
```

Service wrapper:

```java
@Service
class LangChain4jChatService {

    private final ChatModel chatModel;

    LangChain4jChatService(ChatModel chatModel) {
        this.chatModel = chatModel;
    }

    ChatResponse chat(ChatRequest request) {
        String answer = chatModel.chat(request.message());
        return new ChatResponse(answer, List.of());
    }
}
```

## With System Instruction

```java
List<ChatMessage> messages = List.of(
    SystemMessage.from("""
        You are the Shopverse assistant.
        Answer clearly and do not invent product or order data.
        """),
    UserMessage.from(request.message())
);

AiMessage aiMessage = chatModel.chat(messages).aiMessage();
String answer = aiMessage.text();
```

## Model Parameters

Model parameters control behavior.

| Parameter | Meaning | Suggested value |
|---|---|---|
| model name | which model to use | small/cheap model for classification |
| temperature | randomness | low for factual/JSON tasks |
| max tokens | output length | limit for cost control |
| timeout | max wait | required for APIs |
| top-p | randomness control | usually default initially |

Interview answer:

> For backend flows, I keep temperature low when correctness matters, limit
> output tokens, and set timeouts because the model provider is an external
> dependency.

## Streaming

Streaming returns partial output as it is generated.

Use streaming for:

- chat UI
- long answers
- better perceived latency

Avoid streaming for:

- strict JSON extraction
- internal service-to-service calls
- workflows requiring validation before display

Conceptual flow:

```text
user asks -> model streams tokens -> backend sends SSE/WebSocket chunks -> UI renders gradually
```

For your first POC, streaming is optional. Learn normal request/response first.

## Shopverse Endpoint

```http
POST /api/ai/langchain4j/chat
```

Request:

```json
{
  "message": "Explain the Shopverse checkout flow in simple terms"
}
```

Controller:

```java
@RestController
@RequestMapping("/api/ai/langchain4j")
class LangChain4jChatController {

    private final LangChain4jChatService chatService;

    @PostMapping("/chat")
    ChatResponse chat(@RequestBody ChatRequest request) {
        return chatService.chat(request);
    }
}
```

## Common Mistakes

| Mistake | Fix |
|---|---|
| putting API key in code | use environment variables |
| using high temperature for JSON | use low temperature |
| expecting model to know private data | use RAG or tools |
| logging full prompts with PII | log request IDs and metadata |
| no timeout | add timeout and fallback |

## Interview Explanation

<ExpandableAnswer title="What should an architect explain about LangChain4j Tutorial 1: Chat Models And Messages?">

For **LangChain4j Tutorial 1: Chat Models And Messages**, a strong answer starts with the runtime responsibility and the invariant that must remain true. It then walks through one Shopverse request or event, names the important boundary, and explains the failure behavior rather than describing only the happy path. Close with the trade-off, the production signal that verifies the design, and the condition that would justify a different approach. This structure demonstrates practical judgment without memorizing isolated definitions.

</ExpandableAnswer>

> A LangChain4j `ChatModel` is the low-level abstraction for model calls. It
> accepts messages and returns an AI response. I use system messages for stable
> rules, user messages for input, and model parameters such as temperature and
> max tokens to control behavior.

