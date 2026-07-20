-- 011_prevent_profile_role_escalation.sql
-- SECURITY FIX: "Users can update own profile" (002_rls.sql) only checks
-- auth.uid() = id with no WITH CHECK, so any authenticated user can PATCH
-- their own profiles row and set role='admin' directly via the REST API —
-- full privilege escalation, confirmed and immediately reverted during testing.
-- A BEFORE UPDATE trigger is used (not just a WITH CHECK) because comparing
-- NEW.role against OLD.role cleanly requires row-level access to both.
-- Admin role changes still work: they go through supabaseAdmin (service_role)
-- in backend/src/app/api/admin/users/[id]/route.ts, which is exempted below.
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND auth.role() <> 'service_role' THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_profile_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_self_escalation();
