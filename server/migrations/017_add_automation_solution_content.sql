-- Migration 017 — Automation Solution page management.
--
-- 1. Adds `image_url` to the existing `solutions` table. This table
--    (name/slug/summary/services/benefits) and its GET /api/solutions
--    endpoint already existed but were unused by the frontend, which
--    rendered its "solution blocks" from static translation strings
--    instead. This migration + the app code change that goes with it
--    switches the public Automation Solution page to read from this
--    table (falling back to the static text if the table is ever
--    empty), and adds the image field the new admin UI manages.
--
-- 2. Adds `automation_solution_page_content`, a singleton hero-only
--    table following the same _en/_th pattern as home_content /
--    about_content / products_page_content / contacts_page_content.
--
-- Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/017_add_automation_solution_content.sql

ALTER TABLE solutions ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

CREATE TABLE IF NOT EXISTS automation_solution_page_content (
  id             SERIAL PRIMARY KEY,
  hero_meta_en   VARCHAR(255),
  hero_meta_th   VARCHAR(255),
  hero_title_en  VARCHAR(255),
  hero_title_th  VARCHAR(255),
  hero_sub_en    TEXT,
  hero_sub_th    TEXT,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
