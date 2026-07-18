-- 002_rls.sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE performers ENABLE ROW LEVEL SECURITY;
ALTER TABLE performer_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE performer_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- ===== PROFILES =====
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ===== PERFORMERS =====
-- Public: only approved + active subscription
CREATE POLICY "Public can view approved performers"
  ON performers FOR SELECT
  USING (status = 'approved' AND subscription_status = 'active');

-- Performer: can view own profile regardless of status
CREATE POLICY "Performers can view own profile"
  ON performers FOR SELECT
  USING (auth.uid() = id);

-- Performer: can update own profile
CREATE POLICY "Performers can update own profile"
  ON performers FOR UPDATE
  USING (auth.uid() = id);

-- Admin: can view and update all
CREATE POLICY "Admins can view all performers"
  ON performers FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update all performers"
  ON performers FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ===== PERFORMER MEDIA =====
CREATE POLICY "Public can view media of approved performers"
  ON performer_media FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM performers
    WHERE id = performer_media.performer_id
    AND status = 'approved' AND subscription_status = 'active'
  ));

CREATE POLICY "Performers can manage own media"
  ON performer_media FOR ALL
  USING (auth.uid() = performer_id);

-- ===== PERFORMER AVAILABILITY =====
CREATE POLICY "Public can view availability"
  ON performer_availability FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM performers
    WHERE id = performer_availability.performer_id
    AND status = 'approved' AND subscription_status = 'active'
  ));

CREATE POLICY "Performers can manage own availability"
  ON performer_availability FOR ALL
  USING (auth.uid() = performer_id);

-- ===== INQUIRIES =====
CREATE POLICY "Performers can view own inquiries"
  ON inquiries FOR SELECT
  USING (performer_id IN (
    SELECT id FROM performers WHERE id = auth.uid()
  ));

CREATE POLICY "Performers can update inquiry status"
  ON inquiries FOR UPDATE
  USING (performer_id IN (
    SELECT id FROM performers WHERE id = auth.uid()
  ));

CREATE POLICY "Clients can view own inquiries"
  ON inquiries FOR SELECT
  USING (client_id = auth.uid());

-- Anyone can insert (guests allowed)
CREATE POLICY "Anyone can create inquiry"
  ON inquiries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all inquiries"
  ON inquiries FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ===== REVIEWS =====
CREATE POLICY "Public can view visible reviews"
  ON reviews FOR SELECT
  USING (status = 'visible');

CREATE POLICY "Clients can create reviews from own inquiries"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = client_id
    AND EXISTS (
      SELECT 1 FROM inquiries
      WHERE inquiries.id = reviews.inquiry_id
      AND inquiries.client_id = auth.uid()
      AND inquiries.performer_id = reviews.performer_id
    )
  );

CREATE POLICY "Admins can view all reviews"
  ON reviews FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can moderate reviews"
  ON reviews FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ===== SUBSCRIPTIONS =====
CREATE POLICY "Performers can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (performer_id = auth.uid());

CREATE POLICY "Admins can manage subscriptions"
  ON subscriptions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ===== SUBSCRIPTION PLANS =====
CREATE POLICY "Public can view active plans"
  ON subscription_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage plans"
  ON subscription_plans FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
