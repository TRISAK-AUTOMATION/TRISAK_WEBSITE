-- Migration 041 — certificate image for each of the three TRISAK GROUP
-- slides on the Home page ("Our Strength" section), uploaded from
-- Admin → Home. Shared by both languages. NULL/empty shows a placeholder.
--
-- Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/041_home_strength_certificates.sql

ALTER TABLE home_content
  ADD COLUMN IF NOT EXISTS strength1_cert_image VARCHAR(255),
  ADD COLUMN IF NOT EXISTS strength2_cert_image VARCHAR(255),
  ADD COLUMN IF NOT EXISTS strength3_cert_image VARCHAR(255);
