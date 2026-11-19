-- Migration 057 — link products to their series automatically by model code,
-- and list where a series' information comes from.
--
--   series.model_prefixes   model codes the series' products start with, one
--                           per line (or comma separated), e.g. "3G3MX2-"
--   series.sources          JSON [{ label, url }] — e.g. the maker's product page
--                           and datasheet; shown on the series page
--
-- The server links every product of the same brand that has no series yet
-- and whose model / item no. starts with one of them (longest prefix wins):
-- on start, and after each admin change to products or series
-- (server/src/utils/seriesAutoLink.js). Products already linked are never
-- changed. Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/057_series_model_prefixes.sql

ALTER TABLE series
  ADD COLUMN IF NOT EXISTS model_prefixes TEXT,
  ADD COLUMN IF NOT EXISTS sources        JSONB NOT NULL DEFAULT '[]'::jsonb;
