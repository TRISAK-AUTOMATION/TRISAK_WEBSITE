-- Migration 020 — Contact Requests.
--
-- Stores every submission from the public Contact Us form so the admin
-- can manage them under Admin > Contact Requests.
--
-- Status is one of: new | in_progress | completed  (defaults to 'new').
--
-- This replaces the older `contact_submissions` table. Existing rows are
-- copied across (only when contact_requests is still empty, so re-running
-- this file never duplicates data). Old statuses are mapped:
--   new -> new, quoted / follow_up -> in_progress, closed -> completed.
-- The old table is left in place, untouched, so nothing is lost; drop it
-- yourself once you've confirmed the copy looks right.
--
-- Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/020_create_contact_requests.sql

CREATE TABLE IF NOT EXISTS contact_requests (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(150) NOT NULL,
  company        VARCHAR(150),
  email          VARCHAR(150) NOT NULL,
  phone          VARCHAR(50),
  interested_in  VARCHAR(50),
  message        TEXT,
  status         VARCHAR(20) NOT NULL DEFAULT 'new'
                   CHECK (status IN ('new', 'in_progress', 'completed')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_requests_status     ON contact_requests (status);
CREATE INDEX IF NOT EXISTS idx_contact_requests_created_at ON contact_requests (created_at DESC);

DO $$
BEGIN
  IF to_regclass('public.contact_submissions') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM contact_requests) THEN
    INSERT INTO contact_requests
      (name, company, email, phone, interested_in, message, status, created_at, updated_at)
    SELECT
      name, company, email, phone, interested_in, message,
      CASE status
        WHEN 'quoted'    THEN 'in_progress'
        WHEN 'follow_up' THEN 'in_progress'
        WHEN 'closed'    THEN 'completed'
        ELSE 'new'
      END,
      created_at, created_at
    FROM contact_submissions
    ORDER BY id;
  END IF;
END $$;
