---
title: AI Evaluation, Observability, And Operations
difficulty: Advanced
page_type: Tutorial
status: Generic
keywords: [AI evaluation, Recall@k, faithfulness, tool accuracy, token cost, model observability]
learning_objectives: [Build layered AI evaluations, Define production AI telemetry safely, Gate model prompt retrieval and tool changes]
technologies: [Spring AI, OpenTelemetry]
last_reviewed: "2026-07-12"
---

# AI Evaluation, Observability, And Operations

AI quality is a versioned test-and-observation system, not a few successful demos.
Evaluate components separately before judging the complete task.

| Layer | Measures |
|---|---|
| retrieval | Recall@k, Precision@k, MRR, NDCG, authorization leakage |
| generation | relevance, faithfulness, groundedness, citations, refusal |
| tools/agents | selection, argument validity, authorization, completion, steps |
| security | injection success, exfiltration, unsafe action, cross-tenant access |
| operations | TTFT, total latency, tokens, cost, throttling, fallback, errors |

## Dataset And Evaluation Design

Version examples, expected evidence, acceptable answer properties and policy labels.
Include common, boundary, adversarial, multilingual, empty-evidence and outdated-
source cases. Separate a development set from an unseen regression set. Human review
calibrates automated model-based judges; a judge model is also fallible and biased.

Use deterministic stubs for orchestration unit tests, provider contract tests for
schemas/streaming/tool calls, offline golden evaluations for quality, and controlled
online experiments for real user outcomes. Never make live mutating tools available
to an offline evaluator.

## CI Gates

Record model, prompt, retrieval, embedding, index, tool and policy versions. Gate
mandatory safety/schema/authorization metrics absolutely; compare statistical
quality/cost/latency with confidence and review changed examples. Avoid approving a
large regression hidden by one average score.

## Observability

Trace orchestration phases: input policy, retrieval, reranking, model calls, tool
selection, tool execution and validation. Record IDs/versions, token counts, timing,
result category and policy decisions. Prompts, retrieved documents and outputs may
contain secrets or PII: default to metadata, redaction, sampling, access controls and
short retention rather than full payload logging.

Monitor rate limits, provider failures, time to first token, total p95/p99, context
pressure, cache hit, empty retrieval, fallback, tool latency, evaluation drift and
cost per successful task. Circuit breakers and quotas protect spend and dependencies;
fallback output must still pass the same contract and policy.

## Incident Response

Be able to disable a model/tool/prompt/index version, preserve safe metadata, revoke
credentials, identify affected tenants, re-evaluate stored cases and publish a
corrected projection. Treat unsafe output or data disclosure as a security incident.

## Official References

- [Spring AI observability](https://docs.spring.io/spring-ai/reference/observability/)
- [OpenTelemetry generative AI conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
- [OWASP GenAI Security Project](https://genai.owasp.org/)

## Recommended Next Page

Continue with [Model Context Protocol](./MCP-UMBRELLA.md).
