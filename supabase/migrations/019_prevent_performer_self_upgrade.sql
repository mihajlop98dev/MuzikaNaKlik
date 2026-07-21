-- 019_prevent_performer_self_upgrade.sql
-- SECURITY FIX: "Performers can update own profile" (002_rls.sql) only checks
-- auth.uid() = id with no WITH CHECK, so any performer can PATCH their own
-- performers row via the anon key + their own JWT and set status='approved',
-- subscription_status='active' (with a far-future subscription_expires_at),
-- and flip on every paid-plan feature (badges, search_priority, plan_max_*)
-- without ever paying — full paywall/moderation bypass, same bug class as
-- 011_prevent_profile_role_escalation.sql but on the performers table, where
-- the impact is the entire subscription model.
--
-- A BEFORE UPDATE trigger is used for the same reason as 011: pinning
-- protected columns back to OLD needs row-level access to both NEW and OLD,
-- which a WITH CHECK clause alone can't express. Admin moderation
-- (backend/src/app/api/admin/performers/[id]/route.ts) and subscription
-- activation (backend/src/lib/activate-subscription.ts, called only from the
-- Stripe webhook or admin routes) both go through supabaseAdmin
-- (service_role), which is exempted below exactly like 011.
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
    NEW.rating_avg := OLD.rating_avg;
    NEW.rating_count := OLD.rating_count;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_performer_self_upgrade
  BEFORE UPDATE ON public.performers
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_performer_self_upgrade();
