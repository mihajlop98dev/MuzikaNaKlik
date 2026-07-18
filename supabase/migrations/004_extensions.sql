-- 004_extensions.sql

-- Add new columns to performers table
ALTER TABLE performers
  ADD COLUMN IF NOT EXISTS member_count integer,
  ADD COLUMN IF NOT EXISTS equipment text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS travel_radius text CHECK (travel_radius IN ('city_only', 'up_to_50km', 'up_to_100km', 'up_to_200km', 'whole_serbia', 'whole_region')),
  ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS audio_url text,
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS profile_image_url text;

-- Predefined genres for multi-select
CREATE TABLE IF NOT EXISTS genres (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0
);

-- Predefined equipment options
CREATE TABLE IF NOT EXISTS equipment_options (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  icon text,
  sort_order integer NOT NULL DEFAULT 0
);

-- Predefined languages 
CREATE TABLE IF NOT EXISTS language_options (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0
);

-- Favorites (client saves performers)
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  performer_id uuid NOT NULL REFERENCES performers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, performer_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_client ON favorites(client_id);
CREATE INDEX IF NOT EXISTS idx_favorites_performer ON favorites(performer_id);

-- Performer replies to reviews
CREATE TABLE IF NOT EXISTS review_replies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  performer_id uuid NOT NULL REFERENCES performers(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(review_id)
);

-- Seed data for genres
INSERT INTO genres (name, sort_order) VALUES
  ('Narodna', 1),
  ('Zabavna', 2),
  ('Pop', 3),
  ('Rock', 4),
  ('Strane', 5),
  ('Balkan', 6),
  ('Svadbeni hitovi', 7),
  ('Folk', 8),
  ('Domaće', 9),
  ('Strani hitovi', 10),
  ('R&B', 11),
  ('Hip-Hop', 12),
  ('Techno', 13),
  ('House', 14),
  ('Latino', 15),
  ('Jazz', 16),
  ('Blues', 17),
  ('Klasična', 18)
ON CONFLICT (name) DO NOTHING;

-- Seed data for equipment
INSERT INTO equipment_options (name, sort_order) VALUES
  ('Profesionalno ozvučenje', 1),
  ('Rasveta', 2),
  ('DJ oprema', 3),
  ('Muzički instrumenti', 4),
  ('Vokalni monitori', 5),
  ('Pozadinski vokali', 6)
ON CONFLICT (name) DO NOTHING;

-- Seed data for languages
INSERT INTO language_options (name, sort_order) VALUES
  ('Srpski', 1),
  ('Engleski', 2),
  ('Nemački', 3),
  ('Italijanski', 4),
  ('Francuski', 5),
  ('Ruski', 6),
  ('Grčki', 7),
  ('Turski', 8),
  ('Makedonski', 9),
  ('Bosanski', 10),
  ('Hrvatski', 11),
  ('Slovenački', 12)
ON CONFLICT (name) DO NOTHING;
