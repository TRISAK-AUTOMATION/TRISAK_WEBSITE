-- Migration 012 — adds what the Admin Dashboard needs:
--   - a `status` column on contact_submissions, so leads can be tracked
--     as New / Quoted / Follow-up / Closed from the admin panel
--   - an `activity_log` table, so recent admin actions (product added,
--     banner updated, datasheet uploaded, etc.) can be shown on the
--     dashboard's "Recent Activity" feed
--
-- Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/012_add_dashboard_features.sql

ALTER TABLE contact_submissions
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'new';

-- Backfill/guard: keep status within the set the admin UI understands.
ALTER TABLE contact_submissions
  DROP CONSTRAINT IF EXISTS contact_submissions_status_check;
ALTER TABLE contact_submissions
  ADD CONSTRAINT contact_submissions_status_check
  CHECK (status IN ('new', 'quoted', 'follow_up', 'closed'));

CREATE TABLE IF NOT EXISTS activity_log (
  id           SERIAL PRIMARY KEY,
  action_type  VARCHAR(50) NOT NULL, -- product_added | product_edited | product_deleted |
                                      -- brand_added | category_added | series_added |
                                      -- banner_updated | datasheet_uploaded | settings_updated
  description  VARCHAR(255) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions (status);
