-- Migration 010 — adds site_settings, a single-row table for sitewide
-- assets managed from Admin > Settings > Website:
--   - header_logo_url  (Header — Header Logo)
--   - footer_logo_url  (Footer — Footer Logo)
--   - favicon_url      (Favicon — Favicon)
--
-- NULL means "not set" — the site keeps its current built-in text
-- logo (Header/Footer) or default browser icon (favicon) until an
-- admin uploads one.
--
-- Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/010_add_site_settings.sql

CREATE TABLE IF NOT EXISTS site_settings (
  id                SERIAL PRIMARY KEY,
  header_logo_url   VARCHAR(255),
  footer_logo_url   VARCHAR(255),
  favicon_url       VARCHAR(255),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO site_settings (header_logo_url, footer_logo_url, favicon_url)
SELECT NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM site_settings);
