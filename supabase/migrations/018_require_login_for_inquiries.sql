-- Guests can no longer submit inquiries — the app now requires login before
-- reaching the inquiry form, and this makes it a real rule, not just a UI
-- gate a guest could bypass with a direct API call.
DROP POLICY IF EXISTS "Anyone can create inquiry" ON inquiries;
DROP POLICY IF EXISTS "Anyone can create inquiry (public insert restore)" ON inquiries;

CREATE POLICY "Authenticated clients can create their own inquiries"
  ON inquiries FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

REVOKE INSERT ON inquiries FROM anon;
