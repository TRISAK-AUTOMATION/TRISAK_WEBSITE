-- Product status comes from Item Status only.
--
--   products.item_status          SOURCE (Excel "Item Status" / admin form):
--                                 'Active' | 'Discontinued', now NOT NULL.
--   products.availability_status  DERIVED by the database, never written:
--                                 Active                             -> 'available'
--                                 Discontinued, replacement linked   -> 'replacement_available'
--                                 Discontinued, no replacement       -> 'discontinued'
--
-- 'unavailable' no longer exists; stock quantity no longer affects status
-- (products.stock_quantity is kept, unread, so nothing is lost; dropping it is
-- a separate, later step). Replacement Available is no longer picked by hand:
-- it follows from Item Status + replacement_product_id (an admin links the
-- replacement; deleting that product clears the link and the status follows).
--
-- Existing rows (a product is never turned from discontinued into available):
--   item_status Discontinued, or status discontinued / replacement_available
--                                                     -> Discontinued
--   everything else (available, unavailable)          -> Active
-- So a discontinued product that already had a replacement linked now shows
-- Replacement Available. Replacement links, ITEM NO, slugs, images and
-- relations are not touched.
-- The previous values are saved in product_status_backup_035 (rollback below).
--
-- Requires PostgreSQL 12+ (generated columns). Deploy together with the
-- matching server code: the old code writes availability_status directly,
-- which a generated column rejects.
--
-- Run:  psql -U postgres -d trisak_website -f migrations/035_item_status_source_of_truth.sql
--
-- Rollback (restores the old plain column and values):
--   BEGIN;
--   ALTER TABLE products DROP COLUMN availability_status;
--   ALTER TABLE products ADD COLUMN availability_status VARCHAR(30) NOT NULL DEFAULT 'available';
--   ALTER TABLE products ALTER COLUMN item_status DROP NOT NULL, ALTER COLUMN item_status DROP DEFAULT;
--   UPDATE products p SET availability_status = b.availability_status, item_status = b.item_status
--     FROM product_status_backup_035 b WHERE b.id = p.id;
--   CREATE INDEX idx_products_availability_status ON products (availability_status);
--   COMMIT;
--   (then re-run 030 for its CHECK constraint and deploy the previous code)

BEGIN;

-- Only the first run snapshots; a re-run must not overwrite the original values.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_status_backup_035') THEN
    CREATE TABLE product_status_backup_035 AS
      SELECT id, availability_status, item_status, now() AS backed_up_at FROM products;
  END IF;
END $$;

-- Already-migrated databases have a generated availability_status; skip the data steps there.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'availability_status' AND is_generated = 'NEVER'
  ) THEN
    UPDATE products
       SET item_status = CASE
             WHEN item_status = 'Discontinued'
               OR availability_status IN ('discontinued', 'replacement_available') THEN 'Discontinued'
             ELSE 'Active'
           END;

    ALTER TABLE products DROP COLUMN availability_status; -- also drops its CHECK and index
  END IF;
END $$;

ALTER TABLE products ALTER COLUMN item_status SET DEFAULT 'Active';
ALTER TABLE products ALTER COLUMN item_status SET NOT NULL;

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_item_status_check;
ALTER TABLE products
  ADD CONSTRAINT products_item_status_check CHECK (item_status IN ('Active', 'Discontinued'));

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS availability_status VARCHAR(30)
  GENERATED ALWAYS AS (
    CASE
      WHEN item_status <> 'Discontinued' THEN 'available'
      WHEN replacement_product_id IS NOT NULL THEN 'replacement_available'
      ELSE 'discontinued'
    END
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_products_availability_status ON products (availability_status);

COMMIT;
