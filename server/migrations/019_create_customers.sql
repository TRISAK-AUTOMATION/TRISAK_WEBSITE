-- Migration 019 — "Our Customers" logo carousel.
--
-- A minimal table: just the logo image and its display order. No name/
-- text fields by design — the admin page is image-only, matching the
-- public section which only ever shows the logos themselves.
--
-- Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/019_create_customers.sql

CREATE TABLE IF NOT EXISTS customers (
  id           SERIAL PRIMARY KEY,
  image_url    VARCHAR(500) NOT NULL,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
