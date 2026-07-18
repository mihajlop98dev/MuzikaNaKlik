-- 001_schema.sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== PROFILES =====
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('client', 'performer', 'admin')) DEFAULT 'client',
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===== PERFORMERS =====
CREATE TABLE performers (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  stage_name text NOT NULL,
  type text NOT NULL CHECK (type IN ('singer', 'band', 'dj')),
  city text,
  genres text[] DEFAULT '{}',
  description text,
  price_from numeric CHECK (price_from >= 0),
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  subscription_status text NOT NULL CHECK (subscription_status IN ('none', 'active', 'expired')) DEFAULT 'none',
  subscription_expires_at timestamptz,
  rating_avg numeric DEFAULT 0 CHECK (rating_avg >= 0 AND rating_avg <= 5),
  rating_count integer DEFAULT 0 CHECK (rating_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===== PERFORMER MEDIA =====
CREATE TABLE performer_media (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  performer_id uuid NOT NULL REFERENCES performers(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('image', 'video')),
  url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_performer_media_performer ON performer_media(performer_id);

-- ===== PERFORMER AVAILABILITY =====
CREATE TABLE performer_availability (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  performer_id uuid NOT NULL REFERENCES performers(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL CHECK (status IN ('free', 'booked')) DEFAULT 'free',
  UNIQUE(performer_id, date)
);

CREATE INDEX idx_availability_performer ON performer_availability(performer_id);

-- ===== INQUIRIES =====
CREATE TABLE inquiries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  performer_id uuid NOT NULL REFERENCES performers(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  event_type text,
  event_date date,
  location text,
  message text,
  status text NOT NULL CHECK (status IN ('new', 'read', 'responded')) DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inquiries_performer ON inquiries(performer_id);
CREATE INDEX idx_inquiries_client ON inquiries(client_id);

-- ===== REVIEWS =====
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  performer_id uuid NOT NULL REFERENCES performers(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  inquiry_id uuid NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  status text NOT NULL CHECK (status IN ('visible', 'hidden')) DEFAULT 'visible',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, performer_id)
);

CREATE INDEX idx_reviews_performer ON reviews(performer_id);

-- ===== SUBSCRIPTION PLANS =====
CREATE TABLE subscription_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  price numeric NOT NULL CHECK (price >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===== SUBSCRIPTIONS =====
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  performer_id uuid NOT NULL REFERENCES performers(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES subscription_plans(id),
  amount numeric NOT NULL CHECK (amount >= 0),
  payment_method text NOT NULL CHECK (payment_method IN ('manual', 'stripe')),
  stripe_session_id text,
  period_start date NOT NULL,
  period_end date NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'expired', 'cancelled')),
  marked_by_admin uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_performer ON subscriptions(performer_id);
