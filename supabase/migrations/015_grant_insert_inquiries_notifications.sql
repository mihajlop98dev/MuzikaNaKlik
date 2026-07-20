-- 015_grant_insert_inquiries_notifications.sql
-- pg_policies confirms both `inquiries` and `notifications` already have
-- fully permissive INSERT policies (WITH CHECK true, duplicated even —
-- see 002_rls.sql and 013_fix_public_insert_drift.sql). Since policies
-- alone don't explain the persistent 42501 "row violates row-level
-- security policy" on anon/cross-user inserts, the real cause is a
-- missing table-level GRANT — Postgres checks basic INSERT privilege
-- before RLS ever runs, and reports the same 42501 code either way.
-- Someone likely REVOKEd or never GRANTed INSERT on these two tables
-- specifically for anon/authenticated.
GRANT INSERT ON inquiries TO anon, authenticated;
GRANT INSERT ON notifications TO anon, authenticated;
