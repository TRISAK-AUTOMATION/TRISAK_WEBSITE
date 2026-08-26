-- Migration 005 — adds an optional background image for the Hero
-- section ("Industrial Automation & Engineering Solutions"), settable
-- from the admin panel. NULL/empty means no image — the Hero keeps
-- rendering its current plain background.
--
-- Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/005_add_hero_bg_image.sql

ALTER TABLE home_content
  ADD COLUMN IF NOT EXISTS hero_bg_image VARCHAR(255);
