-- 023_subscription_expiry.sql
-- subscription_expires_at has been written by activateSubscription() since the
-- beginning and read by nothing. Nothing ever moved subscription_status off
-- 'active', so a single month's payment bought permanent badges, permanent
-- search priority and permanent visibility — search filters on
-- subscription_status = 'active' and that value never changed.
--
-- The sweep itself lives in /api/cron/subscriptions rather than in SQL,
-- because expiring a subscription has to send mail. This migration adds the
-- column that keeps the reminder from going out twice.

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

-- The sweep looks up rows by status and end date; without this it is a full
-- scan of every subscription ever taken, once a day, forever.
CREATE INDEX IF NOT EXISTS idx_subscriptions_active_period_end
  ON subscriptions(period_end)
  WHERE status = 'active';

-- Defence in depth for the window between the moment a subscription lapses and
-- the moment the daily sweep runs: even with a stale 'active' flag the perks
-- stop, because every public read of performers goes through this policy.
-- 019_prevent_performer_self_upgrade.sql keeps performers from editing these
-- columns themselves, so the two together mean an expired subscription cannot
-- be resurrected from the client.
DROP POLICY IF EXISTS "Public can view approved performers" ON performers;

CREATE POLICY "Public can view approved performers"
  ON performers FOR SELECT
  USING (
    status = 'approved'
    AND subscription_status = 'active'
    AND (subscription_expires_at IS NULL OR subscription_expires_at > now())
  );
