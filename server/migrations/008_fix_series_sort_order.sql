-- Migration 008 — one-time repair for series ordering.
--
-- The admin "edit series" form was hardcoding sortOrder to 0 on every
-- save, so any series that was edited after being reordered got
-- silently reset to the front of its sibling group (same brand +
-- category), and edited siblings could end up sharing sort_order = 0.
-- The form no longer does this — this renumbers each brand+category
-- group sequentially, keeping current relative order as a stable
-- starting point.
--
-- Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/008_fix_series_sort_order.sql

WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY brand_id, category_id ORDER BY sort_order, id) - 1 AS new_order
  FROM series
)
UPDATE series
SET sort_order = ranked.new_order
FROM ranked
WHERE series.id = ranked.id;
