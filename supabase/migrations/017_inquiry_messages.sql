-- Full back-and-forth chat thread per inquiry, replacing the single reply field.
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  inquiry_id uuid NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  sender_role text NOT NULL CHECK (sender_role IN ('client', 'performer')),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_inquiry ON messages(inquiry_id, created_at);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view thread messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM inquiries i
      WHERE i.id = messages.inquiry_id
        AND (i.client_id = auth.uid() OR i.performer_id = auth.uid())
    )
  );

CREATE POLICY "Participants can send thread messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM inquiries i
      WHERE i.id = messages.inquiry_id
        AND (i.client_id = auth.uid() OR i.performer_id = auth.uid())
    )
  );

GRANT SELECT, INSERT ON messages TO authenticated;

-- Clients need to flip inquiries.status back to 'new' when they send a
-- follow-up chat message (performers already could, via 002_rls.sql).
CREATE POLICY "Clients can update own inquiry status"
  ON inquiries FOR UPDATE
  TO authenticated
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

-- Backfill existing single message/reply into the thread so history isn't lost.
INSERT INTO messages (inquiry_id, sender_id, sender_role, body, created_at)
SELECT id, client_id, 'client', message, created_at
FROM inquiries
WHERE message IS NOT NULL AND message <> '';

INSERT INTO messages (inquiry_id, sender_id, sender_role, body, created_at)
SELECT id, performer_id, 'performer', reply, COALESCE(replied_at, created_at)
FROM inquiries
WHERE reply IS NOT NULL AND reply <> '';

-- Enable realtime so both sides see new messages live, if not already on.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;
