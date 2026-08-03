-- 021_stripe_event_log.sql
-- Stripe retries a webhook until it gets a 2xx, and can deliver the same event
-- more than once even after success. Until now the only handler was
-- checkout.session.completed, which is idempotent by accident: activateSubscription()
-- upserts, so a replay just rewrites the same row. Sending email is not
-- idempotent — a replay means the performer gets "uplata primljena" twice.
--
-- This table is the dedupe key. The webhook claims an event by inserting its
-- Stripe event id; a duplicate delivery hits the primary key, the insert fails,
-- and the handler returns 200 without re-sending anything.
CREATE TABLE IF NOT EXISTS processed_stripe_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_processed_stripe_events_processed_at
  ON processed_stripe_events(processed_at);

-- Only the webhook touches this, and it runs with the service role, which
-- bypasses RLS. Enabling RLS with no policy therefore keeps the webhook working
-- while denying every anon/authenticated client — the same posture used for
-- other server-only tables in this schema.
ALTER TABLE processed_stripe_events ENABLE ROW LEVEL SECURITY;
