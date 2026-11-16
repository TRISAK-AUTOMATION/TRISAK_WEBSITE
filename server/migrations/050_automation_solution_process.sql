-- Migration 050 — Automation Solution "Our Engineering Process" section,
-- editable from Admin > Automation Solution.
--
--   process_title_en / _th   section heading
--   process_lede_en / _th    sentence under the heading
--   process_steps  TEXT (JSON)  [{ "icon", "label_en", "label_th", "desc_en", "desc_th" }]
--
-- Empty values fall back to the built-in text, so the page looks the same
-- until an admin edits it. Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/050_automation_solution_process.sql

ALTER TABLE automation_solution_page_content
  ADD COLUMN IF NOT EXISTS process_title_en VARCHAR(255),
  ADD COLUMN IF NOT EXISTS process_title_th VARCHAR(255),
  ADD COLUMN IF NOT EXISTS process_lede_en  TEXT,
  ADD COLUMN IF NOT EXISTS process_lede_th  TEXT,
  ADD COLUMN IF NOT EXISTS process_steps    TEXT;
