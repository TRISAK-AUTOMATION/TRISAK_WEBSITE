-- ITEM NO is stored separately from the URL slug.
--
--   products.item_no   the product's original ITEM NO exactly as entered in
--                      Excel / Admin (spaces and letter case kept).
--                      NULL for products created before this migration:
--                      nothing is invented or back-filled, and no existing
--                      slug / URL is touched.
--   products.slug      unchanged. For new products it is generated from
--                      ITEM NO: trimmed, whitespace runs -> a single hyphen
--                      (e.g. "CIMR JT2A0010BAA" -> "CIMR-JT2A0010BAA").
--
--   product_slug_history  old slugs of products whose slug later changed (an
--                      admin changed the ITEM NO). The public product page
--                      redirects an old URL to the product's current URL.
--
-- Safe to run more than once.
--
-- Run:  psql -U postgres -d trisak_website -f migrations/033_product_item_no.sql

ALTER TABLE products ADD COLUMN IF NOT EXISTS item_no VARCHAR(150);

-- ITEM NO is unique ignoring letter case, so "abc 1" and "ABC 1" can't both exist.
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_item_no_lower
  ON products (LOWER(item_no)) WHERE item_no IS NOT NULL;

CREATE TABLE IF NOT EXISTS product_slug_history (
  id          SERIAL PRIMARY KEY,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  old_slug    VARCHAR(150) NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_slug_history_product_id ON product_slug_history (product_id);
