-- Migration 056 — Products become a guide of main series.
--
-- The public Products section now presents series (e.g. OMRON NX, YASKAWA
-- GA700) grouped by product type (the series' top-level category), each with
-- key figures, highlights with pictures, a spec table and a catalog — instead
-- of listing every model. Individual products stay in the database and admin;
-- they are just no longer listed publicly.
--
-- New series columns (the existing tagline / description are the English
-- text; *_th are Thai, blank = falls back to English):
--   tagline_th, description_th
--   key_specs      JSON [{ value, label_en, label_th }]           — the figures strip
--   highlights     JSON [{ image, title_en, title_th, body_en, body_th }]
--   spec_groups    JSON [{ title_en, title_th, rows: [{ label_en, label_th, value }] }]
--   applications_en / applications_th   one application per line
--   catalog_url    PDF / link for "Download catalog"
--   is_legacy      older series still supported; replaced_by_id points to the successor
--
-- Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/056_series_guide.sql

ALTER TABLE series
  ADD COLUMN IF NOT EXISTS tagline_th      VARCHAR(255),
  ADD COLUMN IF NOT EXISTS description_th  TEXT,
  ADD COLUMN IF NOT EXISTS key_specs       JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS highlights      JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS spec_groups     JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS applications_en TEXT,
  ADD COLUMN IF NOT EXISTS applications_th TEXT,
  ADD COLUMN IF NOT EXISTS catalog_url     VARCHAR(255),
  ADD COLUMN IF NOT EXISTS is_legacy       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS replaced_by_id  INTEGER REFERENCES series(id) ON DELETE SET NULL;

-- Thai names for the product types (top-level categories) shown as the
-- guide's sections; blank = the English name.
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS name_th     VARCHAR(100),
  ADD COLUMN IF NOT EXISTS summary_en  VARCHAR(255),
  ADD COLUMN IF NOT EXISTS summary_th  VARCHAR(255);
