CREATE TABLE activity_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  user_email text,
  action text NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read activity logs"
  ON activity_logs FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
