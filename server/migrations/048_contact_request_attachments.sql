-- Migration 048 — optional file attachment on Contact Us submissions
-- ("Request a quote": part-number list / BOM / spec).
--
--   attachment_file  server-generated filename inside server/private/contact-attachments
--                    (never sent to clients; download via
--                    GET /api/admin/contact-requests/:id/attachment)
--   attachment_name  sanitized original file name, used for the download
--   attachment_size  bytes
--
-- Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/048_contact_request_attachments.sql

ALTER TABLE contact_requests
  ADD COLUMN IF NOT EXISTS attachment_file  VARCHAR(255),
  ADD COLUMN IF NOT EXISTS attachment_name  VARCHAR(255),
  ADD COLUMN IF NOT EXISTS attachment_size  INTEGER;
