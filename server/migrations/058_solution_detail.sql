-- Migration 058 — content of each solution's own page (/automation-solution/:slug).
--
--   solutions.detail   JSON, NULL = use the built-in page text (translations.js):
--     { image, tagline_en, tagline_th,
--       services: [{ icon, title_en, title_th, items_en: [], items_th: [] }],
--       benefits: [{ icon, text_en, text_th, desc_en, desc_th }] }
--
-- Edited from Admin > Automation Solution > (a solution). Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/058_solution_detail.sql

ALTER TABLE solutions ADD COLUMN IF NOT EXISTS detail JSONB;
