-- Migration 009 — one-time repair for product ("Items") ordering.
--
-- The admin product form never sent a sortOrder at all, so every
-- product was saved with sort_order = 0 (the column's default), and
-- there was no reorder control in the admin product list to fix it
-- afterwards. The admin list also displayed products sorted by
-- "last updated" rather than sort_order, which hid the problem.
--
-- Both are now fixed in code (the product list has ↑/↓ controls like
-- Brands/Categories/Series, and the form preserves/assigns
-- sort_order correctly). This renumbers all products sequentially,
-- keeping their current relative order (tie-broken by id, i.e.
-- creation order, since every row currently has the same sort_order)
-- as a stable starting point.
--
-- Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/009_fix_product_sort_order.sql

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY sort_order, id) - 1 AS new_order
  FROM products
)
UPDATE products
SET sort_order = ranked.new_order
FROM ranked
WHERE products.id = ranked.id;
