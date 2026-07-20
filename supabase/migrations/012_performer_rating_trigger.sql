-- 012_performer_rating_trigger.sql
-- No trigger ever recalculated performers.rating_avg / rating_count when a
-- review was inserted, updated (e.g. admin moderation changing status), or
-- deleted — every performer showed "★ 0.0 (0)" regardless of real reviews.
CREATE OR REPLACE FUNCTION public.refresh_performer_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  target_id uuid;
BEGIN
  target_id := COALESCE(NEW.performer_id, OLD.performer_id);
  UPDATE public.performers
  SET
    rating_avg = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM public.reviews WHERE performer_id = target_id AND status = 'visible'), 0),
    rating_count = (SELECT COUNT(*) FROM public.reviews WHERE performer_id = target_id AND status = 'visible')
  WHERE id = target_id;
  RETURN NULL;
END;
$$;

CREATE TRIGGER reviews_refresh_performer_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.refresh_performer_rating();

-- One-time backfill for reviews that already exist.
UPDATE public.performers p
SET
  rating_avg = COALESCE((SELECT ROUND(AVG(r.rating)::numeric, 2) FROM public.reviews r WHERE r.performer_id = p.id AND r.status = 'visible'), 0),
  rating_count = (SELECT COUNT(*) FROM public.reviews r WHERE r.performer_id = p.id AND r.status = 'visible');
