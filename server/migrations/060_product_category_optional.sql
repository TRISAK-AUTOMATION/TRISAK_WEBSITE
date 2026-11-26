-- Catalog products imported from Excel may have no category yet (filled in later).
ALTER TABLE products ALTER COLUMN category_id DROP NOT NULL;
