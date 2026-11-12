-- Migration 044 — optional Hero background image for the History page
-- (Admin > ประวัติบริษัท > Content). NULL/empty keeps the plain Hero.
--
-- Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/044_history_hero_bg_image.sql

ALTER TABLE about_content
  ADD COLUMN IF NOT EXISTS hero_bg_image VARCHAR(255);
