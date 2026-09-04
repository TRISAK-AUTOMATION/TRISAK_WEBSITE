-- Migration 014 — simplifies the Pop-up feature down to a single
-- on/off image popup (per the latest spec: image only, no text,
-- buttons, or links; one popup, admin can upload/replace the image
-- and toggle it on/off). Replaces the earlier multi-popup `popups`
-- table (title/message/link/schedule) added in migration 013.
--
-- Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/014_simplify_popup.sql

DROP TABLE IF EXISTS popups CASCADE;

CREATE TABLE IF NOT EXISTS popup_settings (
  id          SERIAL PRIMARY KEY,
  image_url   VARCHAR(500),
  is_active   BOOLEAN NOT NULL DEFAULT false,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
