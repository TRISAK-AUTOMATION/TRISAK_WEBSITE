-- Migration 013 — adds the `popups` table backing the new Admin >
-- Settings > Pop-up feature: site-wide announcement/promo pop-ups
-- that admins can create, edit, delete, and optionally schedule.
--
-- Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/013_add_popups.sql

CREATE TABLE IF NOT EXISTS popups (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  message     TEXT,
  image_url   VARCHAR(500),
  link_url    VARCHAR(500),
  link_label  VARCHAR(100),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  start_date  DATE,
  end_date    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_popups_is_active ON popups (is_active);
