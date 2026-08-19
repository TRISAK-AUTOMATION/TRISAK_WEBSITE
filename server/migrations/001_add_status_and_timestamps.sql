-- Migration 001 — adds the columns the admin CMS pages need
-- (status toggle, "last updated" timestamp, category image) to an
-- existing database WITHOUT dropping any tables or data.
--
-- Run this if you already had a database from before the admin CMS
-- redesign and got an error like:
--   column "is_active" of relation "brands" does not exist
--
-- Safe to run more than once — every ADD COLUMN uses IF NOT EXISTS.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/001_add_status_and_timestamps.sql

ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS is_active  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS image_url  VARCHAR(255),
  ADD COLUMN IF NOT EXISTS is_active  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE series
  ADD COLUMN IF NOT EXISTS is_active  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
