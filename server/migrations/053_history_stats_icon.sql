-- Migration 053 — an icon per History statistic (the cards in the
-- "Our Experience" banner). A built-in icon key (e.g. "gear") or an uploaded
-- image path; NULL = the card's default icon by position. Safe to run more
-- than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/053_history_stats_icon.sql

ALTER TABLE history_stats
  ADD COLUMN IF NOT EXISTS icon VARCHAR(255);
