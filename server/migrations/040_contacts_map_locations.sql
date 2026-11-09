-- Migration 040 — Contact Us "Map" section shows real Google Maps for both
-- the Head Office and the Warehouse (Admin > แก้ไข > Contact Us > แผนที่).
--
--   *_map       what the embedded map shows: a Google Maps "Embed a map"
--               <iframe> code / src, a google.com/maps URL, "lat,lng", or an
--               address/place name. Blank = use that location's address.
--   *_map_link  where "Open in Google Maps" goes (e.g. a maps.app.goo.gl
--               share link). Blank = the built-in share link.
--
-- Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak -f migrations/040_contacts_map_locations.sql

ALTER TABLE contacts_page_content
  ADD COLUMN IF NOT EXISTS head_office_map      TEXT,
  ADD COLUMN IF NOT EXISTS head_office_map_link VARCHAR(500),
  ADD COLUMN IF NOT EXISTS warehouse_map        TEXT,
  ADD COLUMN IF NOT EXISTS warehouse_map_link   VARCHAR(500);
