-- Products split into two kinds:
--   has_page = false: a row in the /products finder table only (bulk Excel import)
--   has_page = true : also has its own product page (new products, managed one by one)
-- Existing products keep their page when they are marked NEW or already have a
-- picture; the rest become table-only. Excel import never changes has_page.
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_page BOOLEAN NOT NULL DEFAULT false;

UPDATE products p
SET has_page = true
WHERE p.is_new
   OR p.image_url IS NOT NULL
   OR EXISTS (SELECT 1 FROM product_images i WHERE i.product_id = p.id);
