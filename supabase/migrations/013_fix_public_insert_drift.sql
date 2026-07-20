-- 013_fix_public_insert_drift.sql
-- Live database RLS for `inquiries` and `notifications` INSERT is stricter
-- than what 002_rls.sql declares (WITH CHECK (true) for both — anyone,
-- including guests, should be able to create an inquiry, and any caller
-- should be able to insert a notification for ANY user, since notifications
-- are about OTHER people's actions: a guest/client submitting an inquiry
-- notifies the performer, who is a different user).
--
-- Confirmed broken live: a guest (anon key, no session) gets 42501 on
-- inquiries INSERT, and an authenticated client gets 42501 inserting a
-- notification for a performer's user_id (only self-inserts succeed) —
-- meaning the "new inquiry" notification silently never reaches performers,
-- since frontend/src/app/services/inquiry.service.ts fires that insert
-- without checking the result.
--
-- Rather than DROP a live policy whose exact current name/definition is
-- unknown, add new PERMISSIVE policies with WITH CHECK (true) — Postgres
-- OR's multiple permissive policies for the same command, so this restores
-- the intended behavior regardless of what's already there.
CREATE POLICY "Anyone can create inquiry (public insert restore)"
  ON inquiries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can create notification (public insert restore)"
  ON notifications FOR INSERT
  WITH CHECK (true);
