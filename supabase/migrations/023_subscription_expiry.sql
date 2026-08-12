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

-- This migration originally also rewrote the public read policy on performers to
-- check subscription_expires_at, as a guard for the window between a lapse and
-- the next sweep. That part was removed: 024_free_phase_visibility.sql drops the
-- subscription condition from the same policy altogether, so re-running 023 as
-- written would silently undo 024 and hide every performer without a paid plan.
--
-- When charging resumes, put the expiry guard back in the policy that 024
-- defines rather than here.
