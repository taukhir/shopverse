CREATE TABLE IF NOT EXISTS customer_order (
  id BIGINT PRIMARY KEY,
  customer_id BIGINT NOT NULL,
  status TEXT NOT NULL,
  amount_cents BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  legacy_reference TEXT NOT NULL
);

INSERT INTO customer_order
SELECT n, (n % 500) + 1,
       CASE WHEN n % 5 = 0 THEN 'CANCELLED' ELSE 'COMPLETED' END,
       1000 + (n % 20000), NOW() - (n || ' minutes')::interval,
       'legacy-' || n
FROM generate_series(1, 10000) AS n
ON CONFLICT DO NOTHING;

-- Expand: compatible with old readers and writers.
ALTER TABLE customer_order ADD COLUMN IF NOT EXISTS public_reference TEXT;

CREATE TABLE IF NOT EXISTS schema_lab_history (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO schema_lab_history(version) VALUES ('001-expand') ON CONFLICT DO NOTHING;
