-- Migration 046 — Contact Us direct channels: LINE Official Account and
-- office hours (Admin > แก้ไข > Contact Us > ช่องทางติดต่อ). Each row only
-- shows on the page when it has a value.
--
--   line_id             e.g. "@trisak" — shown on the page
--   line_url            optional; blank = https://line.me/R/ti/p/<line_id>
--   office_hours_en/th  free text, line breaks kept
--
-- Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/046_contacts_line_hours.sql

ALTER TABLE contacts_page_content
  ADD COLUMN IF NOT EXISTS line_id          VARCHAR(100),
  ADD COLUMN IF NOT EXISTS line_url         VARCHAR(500),
  ADD COLUMN IF NOT EXISTS office_hours_en  TEXT,
  ADD COLUMN IF NOT EXISTS office_hours_th  TEXT;
