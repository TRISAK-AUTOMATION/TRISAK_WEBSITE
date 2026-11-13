-- Migration 045 — optional photo beside the History page's Company
-- Introduction (Admin > ประวัติบริษัท > Content). NULL/empty uses the
-- built-in default image.
--
-- Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/045_history_intro_image.sql

ALTER TABLE about_content
  ADD COLUMN IF NOT EXISTS intro_image VARCHAR(255);
