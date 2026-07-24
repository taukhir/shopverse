---
title: Elasticsearch Analysis, Query DSL, Relevance, And Aggregations
description: Design analyzers, compose queries and filters, tune scoring, use aggregations, and paginate safely with search_after and point-in-time snapshots.
difficulty: Advanced
page_type: Deep Dive
status: Generic
prerequisites: [Elasticsearch Internals And Mapping]
learning_objectives: [Choose analyzers from language behavior, Build efficient queries, Explain and tune relevance and pagination]
technologies: [Elasticsearch Query DSL, Lucene]
last_reviewed: "2026-07-23"
---

# Elasticsearch Analysis, Query DSL, Relevance, And Aggregations

## Analyzer Pipeline

An analyzer applies character filters, a tokenizer, and token filters. Index-time and search-
time analysis must be compatible with desired matching.

```text
"Wireless-Headphones" -> char filter -> tokenizer
 -> [wireless, headphones] -> lowercase/synonym/stem filters
```

Use the Analyze API to inspect tokens. Standard/language analyzers are starting points.
Normalizers handle single-token keyword normalization. Edge n-grams can support autocomplete
but grow the index; search-as-you-type/completion strategies have different ranking/memory
trade-offs. Synonyms need governance, directional/equivalent semantics, reload strategy, and
tests for false matches.

## Query Versus Filter Context

Query context determines match and score. Filter context answers yes/no, avoids scoring, and
can be cached where useful. Put exact status/tenant/range constraints in filters and text
relevance in `must`/`should` clauses.

```json
{
  "query": {
    "bool": {
      "must": [{"multi_match": {
        "query": "wireless headphones",
        "fields": ["name^3", "description"]
      }}],
      "filter": [
        {"term": {"tenantId": "t-7"}},
        {"term": {"available": true}},
        {"range": {"price": {"lte": 10000}}}
      ]
    }
  }
}
```

`term` queries match exact indexed tokens and generally should not target analyzed `text`.
`match` analyzes input. Phrase, prefix, wildcard, fuzzy, regexp, and script queries have
specific cost; leading wildcard and broad regex can be dangerous.

## Relevance

BM25 scores term frequency, inverse document frequency, and length normalization. Scores are
relative to query/corpus/shard statistics, not business probabilities. Boost fields/clauses,
use function score or rank features for bounded business signals, and keep relevance tests
with judged queries.

Do not “fix” ranking only with larger boosts. Inspect analyzer tokens, matches, Explain/Profile
evidence, corpus distribution, missing fields, and competing clauses. Offline metrics such as
precision@k, recall@k, MRR, and NDCG plus online experiments support decisions.

## Aggregations

Bucket aggregations group documents; metric aggregations compute values; pipeline aggregations
derive from previous results. `terms` aggregation is approximate across shards at bounded size;
inspect error behavior and use composite aggregation for deep bucket pagination.

High-cardinality terms, nested aggregations, scripts, and large date ranges can consume heap/CPU.
Use filters, pre-aggregation/rollups where appropriate, doc values, and query limits.

## Pagination And Sorting

`from` + `size` makes each shard collect deep result windows and is unstable under concurrent
updates. Use a deterministic sort with a unique tiebreaker, `search_after`, and a point-in-time
(PIT) snapshot for consistent deep traversal.

```json
{
  "size": 50,
  "pit": {"id": "...", "keep_alive": "1m"},
  "sort": [{"createdAt": "desc"}, {"productId": "asc"}],
  "search_after": ["2026-07-23T10:00:00Z", "P-100"]
}
```

Scroll is suited to bulk processing/reindex patterns rather than interactive pagination.
PIT/scroll contexts consume resources and require bounded lifetime.

## Search Performance Workflow

1. Capture representative query, index/mapping, shard count, data distribution, and latency.
2. Use slow logs/Profile API selectively; profiling adds overhead.
3. Separate coordination, queue, fetch, query, script, aggregation, disk, GC, and network time.
4. Reduce matched/returned work, fix mapping/query, constrain expensive queries, then scale.
5. Verify relevance and correctness after optimization.

## Interview Questions

**`text` versus `keyword`?** Text is analyzed for full-text relevance; keyword is an exact
single value suited to filters, sorting, and aggregations.

**Why filter context?** It expresses binary constraints without relevance calculation and can
enable caching/optimizations.

**How do you paginate millions of hits?** Avoid deep `from`; use deterministic `search_after`
with PIT for interactive traversal or scroll/sliced workflows for bulk processing.

## Official References

- [Elasticsearch analysis](https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis.html)
- [Query DSL](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html)
- [Search aggregations](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations.html)
- [Paginate search results](https://www.elastic.co/guide/en/elasticsearch/reference/current/paginate-search-results.html)

## Recommended Next

Continue with [Capacity, ILM, Recovery, Security, Performance, And Incidents](./ELASTICSEARCH-OPERATIONS.md).

