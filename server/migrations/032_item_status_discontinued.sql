-- Item Status: "Inactive" is renamed "Discontinued".
--
-- products.item_status is the SOURCE value from the Excel import
-- (Active | Discontinued). It is a separate column from the derived
-- products.availability_status, which this migration does not touch:
--
--   Item Status = Active,       In Stock > 0  -> availability_status 'available'
--   Item Status = Active,       In Stock = 0  -> availability_status 'unavailable'
--   Item Status = Discontinued, any stock     -> availability_status 'discontinued'
--
-- Steps: widen the column ('Discontinued' is 12 chars, the old VARCHAR(10)
-- would reject it), drop the old CHECK, convert existing 'Inactive' rows,
-- add the new CHECK. Safe to run more than once.
--
-- Run:  psql -U postgres -d trisak_website -f migrations/032_item_status_discontinued.sql

BEGIN;

ALTER TABLE products ALTER COLUMN item_status TYPE VARCHAR(20);

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_item_status_check;

UPDATE products SET item_status = 'Discontinued' WHERE item_status = 'Inactive';

ALTER TABLE products
  ADD CONSTRAINT products_item_status_check
  CHECK (item_status IS NULL OR item_status IN ('Active', 'Discontinued'));

COMMIT;
