---
title: "LangChain4j Tutorial 4: RAG And Embedding Stores"
sidebar_position: 6.30
---

# LangChain4j Tutorial 4: RAG And Embedding Stores

RAG is the most important enterprise AI pattern: retrieve trusted context first,
then ask the model to answer from that context.

Official references:

- [RAG](https://docs.langchain4j.dev/tutorials/rag/)
- [Embedding Stores](https://docs.langchain4j.dev/tutorials/embedding-stores/)

## Why RAG Exists

An LLM does not automatically know:

- your Shopverse policies
- your latest product data
- user-specific orders
- internal documentation

RAG solves private knowledge questions:

```text
question -> retrieve relevant knowledge -> model answers from that knowledge
```

## RAG Has Two Flows

Ingestion:

```text
documents -> split into segments -> embed segments -> store in embedding store
```

Runtime:

```text
question -> retrieval augmentor -> content retriever -> embedding store
-> relevant content -> model answer
```

## LangChain4j RAG Terms

| Concept | Meaning |
|---|---|
| document | source file or text |
| segment | chunk of document |
| embedding model | converts segment/question to vector |
| embedding store | stores vectors and segments |
| content retriever | retrieves relevant content |
| retrieval augmentor | augments user message with retrieved content |

## Ingestion Shape

```java
Document document = FileSystemDocumentLoader.loadDocument(
    Path.of("return-policy.md")
);

DocumentSplitter splitter = DocumentSplitters.recursive(500, 50);
List<TextSegment> segments = splitter.split(document);

List<Embedding> embeddings = embeddingModel.embedAll(segments).content();

embeddingStore.addAll(embeddings, segments);
```

What this means:

- load a document
- split it into manageable chunks
- embed each chunk
- store chunks and vectors together

## RetrievalAugmentor

The official RAG tutorial describes `RetrievalAugmentor` as the entry point into
the RAG pipeline.

Conceptual code:

```java
ContentRetriever contentRetriever =
    EmbeddingStoreContentRetriever.builder()
        .embeddingStore(embeddingStore)
        .embeddingModel(embeddingModel)
        .maxResults(5)
        .minScore(0.7)
        .build();

RetrievalAugmentor retrievalAugmentor =
    DefaultRetrievalAugmentor.builder()
        .contentRetriever(contentRetriever)
        .build();
```

Use with AI Service:

```java
ShopversePolicyAssistant assistant = AiServices
    .builder(ShopversePolicyAssistant.class)
    .chatModel(chatModel)
    .retrievalAugmentor(retrievalAugmentor)
    .build();
```

## AI Service For RAG

```java
interface ShopversePolicyAssistant {

    @SystemMessage("""
        You are the Shopverse policy assistant.
        Answer only from retrieved Shopverse context.
        If the answer is missing, say you do not know from the documents.
        """)
    String answer(String question);
}
```

## Secure RAG

Do not retrieve unauthorized chunks.

Each segment should have metadata:

```json
{
  "source": "return-policy.md",
  "visibility": "PUBLIC",
  "tenantId": "shopverse",
  "ownerId": null,
  "documentType": "POLICY"
}
```

For private data:

```json
{
  "source": "order-1001",
  "visibility": "PRIVATE",
  "tenantId": "shopverse",
  "ownerId": "user-42",
  "documentType": "ORDER"
}
```

Rule:

```text
Filter by tenant, role, and owner before context reaches the model.
```

## Retrieval Quality

| Problem | Fix |
|---|---|
| irrelevant chunks | better chunking, min score |
| missing answer | increase top-k, improve docs |
| exact SKU not found | hybrid keyword + vector search |
| too much context | contextual compression |
| many similar chunks | reranking |

## Shopverse Endpoint

```http
POST /api/ai/langchain4j/rag/ask
```

Question:

```text
Can I return a defective item?
```

Expected answer:

```text
Yes. Based on the return policy, defective products can be returned within the
allowed return period.
```

## Interview Explanation

> In LangChain4j RAG, documents are loaded, split into segments, embedded, and
> stored in an embedding store. At runtime, a RetrievalAugmentor retrieves
> relevant content and augments the model request. This lets the model answer
> from Shopverse documents instead of guessing.

