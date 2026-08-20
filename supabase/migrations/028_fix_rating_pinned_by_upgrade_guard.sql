-- 028_fix_rating_pinned_by_upgrade_guard.sql
-- Reviews written through the app never moved the star rating.
--
-- 012 recalculates performers.rating_avg / rating_count from an AFTER trigger on
-- reviews, and is SECURITY DEFINER so RLS is not the obstacle. The obstacle is
-- 019: its BEFORE UPDATE guard on performers pins both rating columns back to
-- OLD whenever auth.role() <> 'service_role'. auth.role() reads the request's
-- JWT claim, not the database role, so it is still 'authenticated' while the
-- SECURITY DEFINER function runs — the guard reverts the fresh figures.
--
-- Confirmed end to end: a client posted a review through the API and the
-- performer stayed at 0.0 (0). It only ever worked when reviews were inserted
-- straight from the SQL editor, which runs as postgres.
--
-- 019 pinned these columns for a good reason — a performer can PATCH their own
-- row and would otherwise award themselves 5.0. Rather than trust the incoming
-- value or exempt the trigger, the guard now recomputes both columns from the
-- reviews table. Nobody can submit a rating, faked or otherwise: whatever is
-- written, the stored value is what the reviews actually say. Two aggregates on
-- each non-service-role update of performers, which happens when a performer
-- edits their profile — rare enough not to matter.
CREATE OR REPLACE FUNCTION public.prevent_performer_self_upgrade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    NEW.status := OLD.status;
    NEW.subscription_status := OLD.subscription_status;
    NEW.subscription_expires_at := OLD.subscription_expires_at;
    NEW.search_priority := OLD.search_priority;
    NEW.plan_max_images := OLD.plan_max_images;
    NEW.plan_max_videos := OLD.plan_max_videos;
    NEW.has_repertoire := OLD.has_repertoire;
    NEW.has_availability := OLD.has_availability;
    NEW.has_review_reply := OLD.has_review_reply;
    NEW.has_featured_badge := OLD.has_featured_badge;
    NEW.has_top_pick_badge := OLD.has_top_pick_badge;
    NEW.has_verified_badge := OLD.has_verified_badge;

    -- Derived from reviews rather than pinned to OLD, so 012's recalculation
    -- survives while a hand-written value is still ignored.
    NEW.rating_avg := COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 2) FROM public.reviews
      WHERE performer_id = NEW.id AND status = 'visible'
    ), 0);
    NEW.rating_count := (
      SELECT COUNT(*) FROM public.reviews
      WHERE performer_id = NEW.id AND status = 'visible'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Repair ratings that were silently dropped while the guard was pinning them.
UPDATE public.performers p
SET
  rating_avg = COALESCE((SELECT ROUND(AVG(r.rating)::numeric, 2) FROM public.reviews r
                          WHERE r.performer_id = p.id AND r.status = 'visible'), 0),
  rating_count = (SELECT COUNT(*) FROM public.reviews r
                   WHERE r.performer_id = p.id AND r.status = 'visible');
