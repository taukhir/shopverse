-- Resumable backfill: rerunning only touches remaining rows.
DO $$
DECLARE changed INTEGER;
BEGIN
  LOOP
    WITH batch AS (
      SELECT id FROM customer_order
      WHERE public_reference IS NULL
      ORDER BY id LIMIT 500
      FOR UPDATE SKIP LOCKED
    )
    UPDATE customer_order o
    SET public_reference = 'order-' || o.id
    FROM batch WHERE o.id = batch.id;
    GET DIAGNOSTICS changed = ROW_COUNT;
    EXIT WHEN changed = 0;
    PERFORM pg_sleep(0.01);
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS ix_customer_order_customer_created
  ON customer_order(customer_id, created_at DESC);

ALTER TABLE customer_order
  ADD CONSTRAINT public_reference_present CHECK (public_reference IS NOT NULL) NOT VALID;
ALTER TABLE customer_order VALIDATE CONSTRAINT public_reference_present;

INSERT INTO schema_lab_history(version) VALUES ('002-backfill-index') ON CONFLICT DO NOTHING;
