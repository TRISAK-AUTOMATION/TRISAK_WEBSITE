-- Migration 002 — adds subcategory nesting: categories can now have a
-- parent category (unlimited depth). Run this if you already have a
-- database from before subcategories were added.
--
-- Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/002_add_category_parent.sql

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE;
