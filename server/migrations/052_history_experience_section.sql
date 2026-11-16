-- Migration 052 — History page "Our Experience" banner + "Partners & Brands"
-- heading, editable from Admin > ประวัติบริษัท (History).
-- (The numbers in the banner stay in history_stats.)
--
--   exp_eyebrow_en / _th        small label above the heading
--   exp_title_en / _th          heading
--   exp_lede_en / _th           sentence under the heading
--   exp_image                   photo in the angled panel on the right
--   partners_eyebrow_en / _th   small label above "Partners & Brands"
--   partners_title_en / _th     "Partners & Brands" heading
--
-- Empty values fall back to the built-in text and photo. Safe to run more
-- than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/052_history_experience_section.sql

ALTER TABLE about_content
  ADD COLUMN IF NOT EXISTS exp_eyebrow_en      VARCHAR(255),
  ADD COLUMN IF NOT EXISTS exp_eyebrow_th      VARCHAR(255),
  ADD COLUMN IF NOT EXISTS exp_title_en        VARCHAR(255),
  ADD COLUMN IF NOT EXISTS exp_title_th        VARCHAR(255),
  ADD COLUMN IF NOT EXISTS exp_lede_en         TEXT,
  ADD COLUMN IF NOT EXISTS exp_lede_th         TEXT,
  ADD COLUMN IF NOT EXISTS exp_image           VARCHAR(255),
  ADD COLUMN IF NOT EXISTS partners_eyebrow_en VARCHAR(255),
  ADD COLUMN IF NOT EXISTS partners_eyebrow_th VARCHAR(255),
  ADD COLUMN IF NOT EXISTS partners_title_en   VARCHAR(255),
  ADD COLUMN IF NOT EXISTS partners_title_th   VARCHAR(255);
