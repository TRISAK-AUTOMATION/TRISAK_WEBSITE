-- Migration 004 — adds the "Our Strength" section heading (the "Why
-- TRISAK" eyebrow + "Our Strength" title shown above the 3 strength
-- blocks on the Home page) as editable fields on home_content.
--
-- Previously only the 3 individual strength items (title/body) could
-- be edited from the admin panel — the section heading itself was
-- hardcoded in the frontend translations and had no admin field.
--
-- Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/004_add_home_strength_heading.sql

ALTER TABLE home_content
  ADD COLUMN IF NOT EXISTS strength_eyebrow_en VARCHAR(255),
  ADD COLUMN IF NOT EXISTS strength_eyebrow_th VARCHAR(255),
  ADD COLUMN IF NOT EXISTS strength_title_en   VARCHAR(255),
  ADD COLUMN IF NOT EXISTS strength_title_th   VARCHAR(255);

-- Backfill the existing row with the values that were previously
-- hardcoded in the frontend, so nothing changes on the live site
-- until someone edits it from the admin panel.
UPDATE home_content
SET
  strength_eyebrow_en = COALESCE(strength_eyebrow_en, 'Why TRISAK'),
  strength_eyebrow_th = COALESCE(strength_eyebrow_th, 'ทำไมต้อง TRISAK'),
  strength_title_en   = COALESCE(strength_title_en, 'Our Strength'),
  strength_title_th   = COALESCE(strength_title_th, 'จุดแข็งของเรา');
