-- Source data behind the derived availability status, so the product Excel
-- export can write it back out:
--
--   stock_quantity  "In Stock" from the Excel import (non-negative number)
--   item_status     "Item Status" from the Excel import: Active | Inactive
--
-- NULL = never imported / unknown (nothing is inferred for existing
-- products). The derived availability_status stays a separate column and
-- is recalculated by the import from these two values; the admin-managed
-- 'replacement_available' status and replacement links are never touched.
-- Safe to run more than once.
--
-- Run:  psql -U postgres -d trisak_website -f migrations/031_product_stock_item_status.sql

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stock_quantity NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS item_status VARCHAR(10);

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_stock_quantity_check;
ALTER TABLE products
  ADD CONSTRAINT products_stock_quantity_check CHECK (stock_quantity IS NULL OR stock_quantity >= 0);

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_item_status_check;
ALTER TABLE products
  ADD CONSTRAINT products_item_status_check CHECK (item_status IS NULL OR item_status IN ('Active', 'Inactive'));
