-- 010_performer_contact_visibility.sql
-- Logged-in clients can see a performer's phone number on their profile page;
-- phone lives in profiles.phone, and profiles previously had no read policy
-- beyond "own row" — this adds a narrow, performer-only exception.
CREATE POLICY "Authenticated users can view performer contact info"
  ON profiles FOR SELECT
  TO authenticated
  USING (role = 'performer');
