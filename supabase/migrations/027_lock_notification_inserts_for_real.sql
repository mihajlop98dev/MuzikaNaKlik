-- 027_lock_notification_inserts_for_real.sql
-- 026 dropped "System can create notifications" and an anonymous INSERT still
-- went through, because there were two permissive INSERT policies, not one:
-- 013_fix_public_insert_drift.sql deliberately added a second under a different
-- name ("Anyone can create notification (public insert restore)"), reasoning
-- that Postgres OR's permissive policies so adding one is safer than dropping a
-- policy whose live name is unknown. That works for opening access and is
-- exactly wrong for closing it — every one of them has to go.
--
-- 013 also warned that names drift between this repo and the live database, so
-- this drops whatever INSERT policies actually exist rather than a list of
-- names, and revokes the table-level grant 015 handed to anon/authenticated.
-- With RLS on and no INSERT policy, the grant alone would not be enough, but
-- leaving it would misstate the intent.
--
-- Legitimate writes are unaffected: they all run server-side under the service
-- role, which bypasses RLS — /api/notify/inquiry for inquiries and thread
-- messages, and the performer registration route for the admin notice.
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notifications'
      AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.notifications', pol.policyname);
    RAISE NOTICE 'Obrisana INSERT politika: %', pol.policyname;
  END LOOP;
END $$;

REVOKE INSERT ON notifications FROM anon, authenticated;
