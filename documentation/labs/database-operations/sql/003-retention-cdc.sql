CREATE TABLE IF NOT EXISTS operational_event (
  id BIGINT GENERATED ALWAYS AS IDENTITY,
  occurred_at TIMESTAMPTZ NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  PRIMARY KEY (id, occurred_at)
) PARTITION BY RANGE (occurred_at);

CREATE TABLE IF NOT EXISTS operational_event_current
PARTITION OF operational_event
FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

INSERT INTO operational_event(occurred_at, event_type, payload)
VALUES ('2026-07-12T00:00:00Z', 'ORDER_COMPLETED', '{"orderId":1,"amountCents":1001}');

SELECT pg_create_logical_replication_slot('dbops_lab_slot', 'test_decoding')
WHERE NOT EXISTS (SELECT 1 FROM pg_replication_slots WHERE slot_name = 'dbops_lab_slot');

INSERT INTO schema_lab_history(version) VALUES ('003-retention-cdc') ON CONFLICT DO NOTHING;
