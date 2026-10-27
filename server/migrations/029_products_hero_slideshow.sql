-- Products page Hero background slideshow.
--
-- Adds an ordered list of background image URLs (JSON array) to the
-- Products page content row. The existing single hero_bg_image column
-- is kept (it mirrors the first slide) so nothing that reads it breaks.
-- Only products_page_content is touched — Home / Contacts / Automation
-- Solution are unaffected.
--
-- Existing single images are carried over as a 1-image slideshow.
-- Safe to run more than once.

ALTER TABLE products_page_content
  ADD COLUMN IF NOT EXISTS hero_bg_images JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE products_page_content
SET hero_bg_images = jsonb_build_array(hero_bg_image)
WHERE hero_bg_image IS NOT NULL
  AND hero_bg_image <> ''
  AND hero_bg_images = '[]'::jsonb;
