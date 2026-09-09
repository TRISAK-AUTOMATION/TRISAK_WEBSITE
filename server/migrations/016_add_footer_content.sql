-- Migration 016 — adds `footer_content`, backing the new "Footer"
-- item under Admin Sidebar > Edit. Same singleton, `_en`/`_th`
-- pattern as home_content/about_content/etc. Only footer-specific
-- copy lives here (tagline, bottom legal lines); the footer's head
-- office / warehouse contact block intentionally reuses
-- `contacts_page_content` (edited via Edit > Contact Us) rather than
-- duplicating those fields, so there's one place to update an
-- address or phone number and both pages stay in sync.
--
-- Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/016_add_footer_content.sql

CREATE TABLE IF NOT EXISTS footer_content (
  id                   SERIAL PRIMARY KEY,
  tagline_en           VARCHAR(255),
  tagline_th           VARCHAR(255),
  rights_en            VARCHAR(255),
  rights_th            VARCHAR(255),
  authorized_line_en   VARCHAR(255),
  authorized_line_th   VARCHAR(255),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
