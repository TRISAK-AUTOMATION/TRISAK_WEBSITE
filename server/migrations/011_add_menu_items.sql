-- Migration 011 — adds menu_items, for Admin > Menu: managing the
-- website's Header and Footer navigation without touching code.
--
-- "location" is either 'header' or 'footer'. Each item has a
-- bilingual label (label_en/label_th), a url (internal path like
-- "/products" or a full external link), an is_active flag, and a
-- sort_order used both for display and for the admin's drag-and-drop
-- reordering.
--
-- Seeds both groups with the navigation currently hardcoded in
-- Header.jsx/Footer.jsx, so nothing changes on the live site until
-- an admin edits something from Admin > Menu.
--
-- Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/011_add_menu_items.sql

CREATE TABLE IF NOT EXISTS menu_items (
  id           SERIAL PRIMARY KEY,
  location     VARCHAR(20) NOT NULL CHECK (location IN ('header', 'footer')),
  label_en     VARCHAR(150) NOT NULL,
  label_th     VARCHAR(150) NOT NULL,
  url          VARCHAR(255) NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO menu_items (location, label_en, label_th, url, sort_order)
SELECT * FROM (VALUES
  ('header', 'Home', 'หน้าแรก', '/', 1),
  ('header', 'History', 'ประวัติบริษัท', '/history', 2),
  ('header', 'Products', 'สินค้า', '/products', 3),
  ('header', 'Automation Solution', 'โซลูชันระบบอัตโนมัติ', '/automation-solution', 4),
  ('header', 'Contacts', 'ติดต่อเรา', '/contacts', 5),
  ('footer', 'Home', 'หน้าแรก', '/', 1),
  ('footer', 'History', 'ประวัติบริษัท', '/history', 2),
  ('footer', 'Products', 'สินค้า', '/products', 3),
  ('footer', 'Automation Solution', 'โซลูชันระบบอัตโนมัติ', '/automation-solution', 4),
  ('footer', 'Contacts', 'ติดต่อเรา', '/contacts', 5)
) AS seed(location, label_en, label_th, url, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM menu_items);
