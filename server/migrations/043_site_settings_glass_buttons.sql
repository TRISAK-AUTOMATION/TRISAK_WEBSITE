-- Migration 043 — adds site_settings.glass_buttons, controlled from
-- Admin > Settings > Website > Buttons.
--   FALSE (default) = public site buttons keep the current solid/outline style
--   TRUE            = public site buttons use the "Liquid Glass" style
--
-- Existing rows default to FALSE so nothing changes until an admin turns
-- it on. Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/043_site_settings_glass_buttons.sql

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS glass_buttons BOOLEAN NOT NULL DEFAULT FALSE;
