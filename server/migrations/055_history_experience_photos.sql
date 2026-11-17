-- Migration 055 — several photos for the History page "Our Experience"
-- section (shown as a mosaic with a full-screen viewer).
--
--   exp_images   JSON array of image URLs, in display order
--
-- When empty, the page falls back to exp_image (the single photo from
-- migration 052), then to the built-in photos. Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/055_history_experience_photos.sql

ALTER TABLE about_content
  ADD COLUMN IF NOT EXISTS exp_images TEXT;
