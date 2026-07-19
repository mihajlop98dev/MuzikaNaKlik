UPDATE subscription_plans SET name = 'Basic', price = 999 WHERE name = 'Basic';
UPDATE subscription_plans SET name = 'Standard', price = 1999 WHERE name = 'Featured';
UPDATE subscription_plans SET name = 'Premium', price = 3499 WHERE name = 'Premium';

ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '[]'::jsonb;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_images int DEFAULT 1;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_videos int DEFAULT 1;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_repertoire boolean DEFAULT false;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_availability boolean DEFAULT false;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_review_reply boolean DEFAULT false;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_featured_badge boolean DEFAULT false;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_top_pick_badge boolean DEFAULT false;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_featured_home boolean DEFAULT false;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_verified_badge boolean DEFAULT false;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_monthly_report boolean DEFAULT false;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS has_priority_support boolean DEFAULT false;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS search_priority int DEFAULT 0;

UPDATE subscription_plans SET
  description = 'Profil vidljiv u pretrazi, osnovni opis, do 1 slike i 1 video, prijem upita, cenovnik',
  features = '["Profil vidljiv u pretrazi","1 profilna slika","1 YouTube video","Opis o nama","Prijem upita","Cenovnik"]'::jsonb,
  max_images = 1,
  max_videos = 1,
  has_repertoire = false,
  has_availability = false,
  has_review_reply = false,
  has_featured_badge = false,
  has_top_pick_badge = false,
  has_featured_home = false,
  has_verified_badge = false,
  has_monthly_report = false,
  has_priority_support = false,
  search_priority = 0
WHERE name = 'Basic';

UPDATE subscription_plans SET
  description = 'Sve iz Basic paketa plus do 10 slika, 5 video snimaka, repertoar, kalendar termina, prioritet u pretrazi, bedž Istaknuto, odgovor na recenzije',
  features = '["Sve iz Basic paketa","Do 10 slika u galeriji","Do 5 video snimaka","Repertoar lista","Kalendar slobodnih termina","Prioritet u pretrazi","Bedž Istaknuto","Odgovor na recenzije"]'::jsonb,
  max_images = 10,
  max_videos = 5,
  has_repertoire = true,
  has_availability = true,
  has_review_reply = true,
  has_featured_badge = true,
  has_top_pick_badge = false,
  has_featured_home = false,
  has_verified_badge = false,
  has_monthly_report = false,
  has_priority_support = false,
  search_priority = 1
WHERE name = 'Standard';

UPDATE subscription_plans SET
  description = 'Sve iz Standard paketa plus neograničena galerija i video, bedž Top izbor, najviši prioritet u pretrazi, featured na naslovnoj, verifikacija, mesečni izveštaj, prioritetna podrška',
  features = '["Sve iz Standard paketa","Neograničena galerija","Neograničeni video snimci","Bedž Top izbor","Najviši prioritet u pretrazi","Featured na naslovnoj strani","Verifikovani profil","Mesečni izveštaj","Prioritetna podrška"]'::jsonb,
  max_images = 999,
  max_videos = 999,
  has_repertoire = true,
  has_availability = true,
  has_review_reply = true,
  has_featured_badge = false,
  has_top_pick_badge = true,
  has_featured_home = true,
  has_verified_badge = true,
  has_monthly_report = true,
  has_priority_support = true,
  search_priority = 2
WHERE name = 'Premium';
