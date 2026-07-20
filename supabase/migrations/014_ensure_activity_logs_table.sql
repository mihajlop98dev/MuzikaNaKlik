-- 014_ensure_activity_logs_table.sql
-- The `activity_logs` table from 006_activity_logs.sql doesn't exist on the
-- live database (PostgREST: "Could not find the table 'public.activity_logs'
-- in the schema cache") — same live-vs-migration drift pattern as the RLS
-- issues fixed in 013. Admin actions (approve/reject performer, moderate
-- review, change user role, update plan, create/renew subscription) now
-- write here via supabaseAdmin, but every insert was silently failing.
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  user_email text,
  action text NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read activity logs" ON activity_logs;
CREATE POLICY "Admins can read activity logs"
  ON activity_logs FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
