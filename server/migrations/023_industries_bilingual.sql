-- Migration 023 — Industries Slider: EN/TH content.
--
-- Adds Thai name/description alongside the existing English name/
-- description, so each slide carries both languages instead of the
-- Thai UI having no real content. Existing English data is untouched;
-- Thai fields are left blank for existing rows and the slider falls
-- back to the English text for any blank Thai field.
--
-- Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/023_industries_bilingual.sql

ALTER TABLE industries ADD COLUMN IF NOT EXISTS name_th        VARCHAR(100);
ALTER TABLE industries ADD COLUMN IF NOT EXISTS description_th TEXT;
