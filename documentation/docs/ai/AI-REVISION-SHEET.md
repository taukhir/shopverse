---
title: AI RAG Agents And Java AI Revision Sheet
description: Rapid revision of LLMs, prompting, embeddings, RAG, tool calling, agents, evaluation, security, Spring AI, and LangChain4j.
difficulty: Advanced
page_type: Interview
status: Generic
prerequisites: [AI Learning Track]
learning_objectives: [Recall AI application concepts quickly, Review RAG and agent architectures, Defend accuracy security latency and cost decisions]
technologies: [LLMs, RAG, MCP, Spring AI, LangChain4j]
last_reviewed: "2026-07-23"
---

# AI RAG Agents And Java AI Revision Sheet

## One-Line Recall

| Concept | Revision answer |
|---|---|
| token | Model input/output unit; cost and context limits apply to tokens, not characters. |
| context window | Maximum tokens considered for one model request. |
| temperature | Sampling variability control, not a factuality guarantee. |
| embedding | Vector representation used for semantic similarity. |
| RAG | Retrieve trusted context and supply it to generation. |
| tool calling | Model proposes structured invocation; application validates and executes it. |
| agent | Model-driven loop that selects actions, observes results, and continues under limits. |
| MCP | Protocol for exposing tools, resources, and prompts to AI clients. |
| evaluation | Repeatable measurement of quality, safety, latency, and cost. |

## RAG Runtime

```text
ingest -> parse -> chunk -> embed -> index
query -> authorize/filter -> retrieve -> rerank -> prompt -> generate
-> cite/validate -> observe/evaluate
```

Retrieval quality depends on source quality, chunk boundaries, metadata, embedding,
query transformation, filtering, top-k, reranking, and freshness. RAG reduces but
does not eliminate hallucination.

## Agent And Tool Safety

- authenticate the user and workload;
- authorize every tool action at execution time;
- validate structured arguments against a schema;
- separate read and write tools;
- require approval for consequential actions;
- bound steps, time, tokens, retries, concurrency, and spend;
- treat model/tool content as untrusted input;
- prevent prompt injection from changing policy;
- audit proposal, authorization, execution, and outcome.

## Evaluation Matrix

| Dimension | Example measure |
|---|---|
| retrieval | recall@k, precision@k, relevant-context rate |
| answer | correctness, groundedness, citation support, completeness |
| safety | policy violation, leakage, prompt-injection success |
| operation | latency, error rate, timeout, tool success, token/cost |
| business | task completion, escalation, user correction, outcome quality |

Use a versioned representative dataset, automated graders plus human review, and
regression gates. A demo conversation is not an evaluation.

## Framework Boundary

Spring AI and LangChain4j provide model clients, prompts, structured output, tools,
memory, embeddings, vector-store and RAG integrations. Keep domain policy,
authorization, transactions, idempotency, and audit outside framework magic so the
model/provider remains replaceable.

## Scenario Prompts

- retrieved document contains malicious instructions;
- one tenant retrieves another tenant's data;
- tool call repeats after timeout;
- model output violates required JSON schema;
- provider is slow or rate limited;
- embeddings change and old vectors remain indexed;
- answer is fluent but unsupported by retrieved evidence;
- chat memory grows without bound or stores sensitive data.

## Final Checklist

- model use case and acceptable uncertainty are explicit;
- sources, retrieval, citations, and freshness are governed;
- tool execution is validated, authorized, bounded, and audited;
- tenant and sensitive data are isolated;
- quality, safety, latency, and cost have regression tests;
- provider failure and fallback behavior are defined;
- business decisions do not depend on unverified free-form output.

Continue with [AI Interview Q&A](./INTERVIEW-QA.md) and [Hands-On Labs](./HANDS-ON-LABS.md).
