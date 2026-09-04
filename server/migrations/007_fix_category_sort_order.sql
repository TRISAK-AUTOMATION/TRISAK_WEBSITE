-- Migration 007 — one-time repair for category ordering.
--
-- The admin "edit category" form was hardcoding sortOrder to 0 on
-- every save, so any category that was edited after being reordered
-- got silently reset to the front of its sibling group, and edited
-- siblings could end up sharing sort_order = 0. The form no longer
-- does this — this renumbers each parent's children (and the
-- top-level categories, where parent_id is NULL) sequentially,
-- keeping their current relative order as a stable starting point.
--
-- Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/007_fix_category_sort_order.sql

WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY parent_id ORDER BY sort_order, id) - 1 AS new_order
  FROM categories
)
UPDATE categories
SET sort_order = ranked.new_order
FROM ranked
WHERE categories.id = ranked.id;
