-- Migration 051 — History page "Why TRISAK Group" section, editable from
-- Admin > ประวัติบริษัท (History).
--
--   why_title_en / _th            section heading
--   why_lede_en / _th             sentence under the heading
--   why_process_title_en / _th    small heading above the process steps
--   why_reasons  TEXT (JSON)      [{ "icon", "title_en", "title_th", "body_en", "body_th" }]
--   why_steps    TEXT (JSON)      same shape, the process chain on the right
--   why_bg_image                  background photo behind the process column
--
-- Empty values fall back to the built-in text and photo, so the page looks
-- the same until an admin edits it. Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/051_history_why_section.sql

ALTER TABLE about_content
  ADD COLUMN IF NOT EXISTS why_title_en         VARCHAR(255),
  ADD COLUMN IF NOT EXISTS why_title_th         VARCHAR(255),
  ADD COLUMN IF NOT EXISTS why_lede_en          TEXT,
  ADD COLUMN IF NOT EXISTS why_lede_th          TEXT,
  ADD COLUMN IF NOT EXISTS why_process_title_en VARCHAR(255),
  ADD COLUMN IF NOT EXISTS why_process_title_th VARCHAR(255),
  ADD COLUMN IF NOT EXISTS why_reasons          TEXT,
  ADD COLUMN IF NOT EXISTS why_steps            TEXT,
  ADD COLUMN IF NOT EXISTS why_bg_image         VARCHAR(255);
