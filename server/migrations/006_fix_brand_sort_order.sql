-- Migration 006 — one-time repair for brand ordering.
--
-- The admin "edit brand" form was hardcoding sortOrder to 0 on every
-- save (see AdminBrandForm.jsx), so any brand that was edited after
-- being reordered got silently reset to the front of the list, and
-- edited brands could end up sharing sort_order = 0 with each other.
-- The form no longer does this, but if brands were already edited in
-- production, their sort_order may currently be duplicated/out of
-- sync with what the up/down arrows previously set.
--
-- This renumbers all brands sequentially (0, 1, 2, ...), keeping
-- their current relative order (ties broken by id) as a stable
-- starting point. Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/006_fix_brand_sort_order.sql

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY sort_order, id) - 1 AS new_order
  FROM brands
)
UPDATE brands
SET sort_order = ranked.new_order
FROM ranked
WHERE brands.id = ranked.id;
