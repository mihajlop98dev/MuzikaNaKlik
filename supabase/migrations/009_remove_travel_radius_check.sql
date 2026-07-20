-- 009_remove_travel_radius_check.sql
-- travel_radius is free text negotiated directly between client and performer,
-- not a fixed set of options — the enum-style CHECK constraint was rejecting
-- normal registration input (e.g. "Cela Srbija", "do 100km").
ALTER TABLE performers DROP CONSTRAINT IF EXISTS performers_travel_radius_check;
