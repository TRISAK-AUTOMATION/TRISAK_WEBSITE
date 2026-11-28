-- The same subcategory name may sit under different parents (e.g. "Accessories"
-- under PLC and under Inverter). Names stay unique among siblings; slugs stay
-- globally unique (the admin form prefixes a subcategory slug with its parent's).
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key;
-- COALESCE so top-level categories (parent_id NULL) are also checked against each other
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_parent_name
  ON categories (COALESCE(parent_id, 0), lower(name));
