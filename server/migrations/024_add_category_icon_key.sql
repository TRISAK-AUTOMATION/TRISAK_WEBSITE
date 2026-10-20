-- Migration 024 — admin-selectable category icons.
-- Adds categories.icon_key (a key from the icon library the admin picks
-- in Category > Edit > Icon tab) and seeds the original nine categories
-- so the public site looks unchanged after upgrading.
--
-- Safe to run more than once. Only fills icon_key where it is still NULL.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/024_add_category_icon_key.sql

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS icon_key VARCHAR(50);

UPDATE categories SET icon_key = slug
WHERE icon_key IS NULL
  AND slug IN ('plc-hmi', 'inverter', 'servo-motion', 'industrial-robot',
               'sensors', 'safety', 'io-industrial-pc',
               'electrical-components', 'enclosures');
