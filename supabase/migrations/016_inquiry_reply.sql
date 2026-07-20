-- Allow performers to reply to inquiries; clients then see the reply.
-- No new RLS policy needed: "Performers can update inquiry status" (002_rls.sql)
-- already permits the performer to update any column on their own inquiry rows.
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS reply text;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS replied_at timestamptz;

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('new_performer', 'new_inquiry', 'performer_approved', 'performer_rejected', 'review_reply', 'inquiry_reply'));
