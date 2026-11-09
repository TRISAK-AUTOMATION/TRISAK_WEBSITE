-- Migration 038 — Career page Hero becomes admin-editable
-- (Admin > ตำแหน่งงาน > tab "Hero"). Blank fields fall back to the built-in
-- translation text; blank hero_bg_image keeps the plain (no-photo) Hero.
--
-- Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak -f migrations/038_career_hero.sql

ALTER TABLE career_page_content
  ADD COLUMN IF NOT EXISTS hero_meta_en  VARCHAR(255),
  ADD COLUMN IF NOT EXISTS hero_meta_th  VARCHAR(255),
  ADD COLUMN IF NOT EXISTS hero_title_en VARCHAR(255),
  ADD COLUMN IF NOT EXISTS hero_title_th VARCHAR(255),
  ADD COLUMN IF NOT EXISTS hero_sub_en   TEXT,
  ADD COLUMN IF NOT EXISTS hero_sub_th   TEXT,
  ADD COLUMN IF NOT EXISTS hero_bg_image VARCHAR(255);
