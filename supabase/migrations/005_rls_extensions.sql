-- 005_rls_extensions.sql
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_replies ENABLE ROW LEVEL SECURITY;

-- Favorites RLS
CREATE POLICY "Clients can manage own favorites"
  ON favorites FOR ALL
  USING (auth.uid() = client_id);

CREATE POLICY "Public can view favorite counts"
  ON favorites FOR SELECT
  USING (true);

-- Review replies RLS
CREATE POLICY "Public can view review replies"
  ON review_replies FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM reviews WHERE reviews.id = review_replies.review_id AND reviews.status = 'visible'
  ));

CREATE POLICY "Performers can manage own replies"
  ON review_replies FOR ALL
  USING (auth.uid() = performer_id);

CREATE POLICY "Admins can manage all replies"
  ON review_replies FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
