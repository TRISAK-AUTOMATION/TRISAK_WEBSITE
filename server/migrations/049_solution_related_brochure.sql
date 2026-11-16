-- Migration 049 — optional "related products" link + PDF brochure per
-- Automation Solution block (Admin > Automation Solution > Edit Solution Block).
-- Each item only renders on the public page when it has a value.
--
--   related_url       where the "related products" link goes; a site path
--                     ("/products/omron") or an http(s) URL
--   related_label     link text (EN)
--   related_label_th  link text (TH)
--   brochure_url      public PDF brochure (uploaded via /api/admin/upload)
--
-- Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/049_solution_related_brochure.sql

ALTER TABLE solutions
  ADD COLUMN IF NOT EXISTS related_url       VARCHAR(500),
  ADD COLUMN IF NOT EXISTS related_label     VARCHAR(150),
  ADD COLUMN IF NOT EXISTS related_label_th  VARCHAR(150),
  ADD COLUMN IF NOT EXISTS brochure_url      VARCHAR(500);
