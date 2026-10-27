-- Product availability status + optional replacement product.
--
--   availability_status     one of: available | unavailable | discontinued |
--                           replacement_available (validated by the API and
--                           by the CHECK constraint below)
--   status_note             optional free-text note shown with the status
--   replacement_product_id  optional link to an EXISTING product; set only by
--                           an admin, never inferred. SET NULL if that
--                           product is later deleted.
--   status_updated_at       when status / note / replacement last changed
--
-- Existing products keep all their data and URLs and default to 'available'.
-- Safe to run more than once.
--
-- Run:  psql -U postgres -d trisak_website -f migrations/030_product_availability.sql

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS availability_status VARCHAR(30) NOT NULL DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS status_note TEXT,
  ADD COLUMN IF NOT EXISTS replacement_product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ;

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_availability_status_check;
ALTER TABLE products
  ADD CONSTRAINT products_availability_status_check
  CHECK (availability_status IN ('available', 'unavailable', 'discontinued', 'replacement_available'));

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_replacement_not_self_check;
ALTER TABLE products
  ADD CONSTRAINT products_replacement_not_self_check
  CHECK (replacement_product_id IS NULL OR replacement_product_id <> id);

CREATE INDEX IF NOT EXISTS idx_products_availability_status ON products (availability_status);
CREATE INDEX IF NOT EXISTS idx_products_replacement_product_id ON products (replacement_product_id);
