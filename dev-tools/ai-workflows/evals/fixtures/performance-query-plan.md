# Synthetic Performance Evidence

- Trace breakdown attributes 1.55 seconds of the 1.8-second p95 to database work.
- One query loads the page of orders.
- Two additional lazy-loaded relationships issue 40 queries for 20 orders.
- Query plans use existing indexes; no dominant table scan is present.
- The controlled change fetches the required relationships without changing
  result cardinality or authorization filters.
- Before and after runs use the same revision except for that controlled query
  change, dataset, concurrency, warm-up, duration, and environment.
