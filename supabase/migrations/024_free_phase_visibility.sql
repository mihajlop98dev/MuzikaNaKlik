-- 024_free_phase_visibility.sql
-- Visibility no longer depends on a paid subscription.
--
-- Charging is on hold until there is a registered business: recurring payment
-- for a service is business activity, and the payment rails are blocked anyway
-- (Stripe does not onboard Serbian merchants; Polar and Paddle prohibit booking
-- directories as a category). Until then nobody can pay, so gating visibility on
-- payment would leave the site with an empty search page.
--
-- This is also the better product. A directory is worth using when everyone is
-- in it; what a plan should buy is prominence — badges, search priority, more
-- media — not the right to exist. Those perks are untouched and still keyed to
-- the plan columns on performers.
--
-- To start charging again: restore the subscription_status condition here and
-- set environment.paidPlansEnabled = true. Nothing else was removed.
DROP POLICY IF EXISTS "Public can view approved performers" ON performers;

CREATE POLICY "Public can view approved performers"
  ON performers FOR SELECT
  USING (status = 'approved');
