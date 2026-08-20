-- 025_free_phase_media_visibility.sql
-- Completes what 024_free_phase_visibility.sql started.
--
-- 024 dropped the paid-subscription condition from the public read policy on
-- performers, but two more policies from 002_rls.sql gate on the same thing by
-- looking the performer up: performer_media and performer_availability. The
-- result was a profile that appears in search and opens normally, while its
-- gallery, videos and calendar are silently empty — the tabs render, they just
-- return no rows, so it reads as "the performer added nothing" rather than as a
-- permission problem.
--
-- Same reasoning as 024: while nothing can be paid for, gating content on
-- payment only hides the site's own substance. What a plan should buy is
-- prominence, not the right to show what you uploaded.
--
-- To start charging again: restore `AND subscription_status = 'active'` in all
-- three policies — here and in the one 024 defines.

DROP POLICY IF EXISTS "Public can view media of approved performers" ON performer_media;

CREATE POLICY "Public can view media of approved performers"
  ON performer_media FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM performers
    WHERE id = performer_media.performer_id
      AND status = 'approved'
  ));

DROP POLICY IF EXISTS "Public can view availability" ON performer_availability;

CREATE POLICY "Public can view availability"
  ON performer_availability FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM performers
    WHERE id = performer_availability.performer_id
      AND status = 'approved'
  ));
