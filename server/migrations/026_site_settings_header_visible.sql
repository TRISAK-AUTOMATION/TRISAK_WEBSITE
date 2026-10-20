-- Migration 026 — adds site_settings.header_visible, controlled from
-- Admin > Settings > Website > Header.
--   TRUE  (default) = the public site shows the main Header
--   FALSE           = the public site hides the main Header
--
-- Existing rows default to TRUE so behaviour is unchanged until an
-- admin turns it off. Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/026_site_settings_header_visible.sql

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS header_visible BOOLEAN NOT NULL DEFAULT TRUE;
