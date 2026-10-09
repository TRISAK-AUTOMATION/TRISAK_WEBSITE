-- Migration 022 — Industries slider content.
--
-- Expands `industries` (previously just id/name/sort_order, used for the
-- plain text list on the Home page) into full content for the
-- center-focused Industries slider: a number badge, background image,
-- overlay color, highlight bullets, an "Explore More" link, and an
-- active/inactive flag, managed from Admin > Industries.
--
-- Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/022_industries_slider.sql

ALTER TABLE industries ADD COLUMN IF NOT EXISTS number        VARCHAR(10);
ALTER TABLE industries ADD COLUMN IF NOT EXISTS image_url     VARCHAR(255);
ALTER TABLE industries ADD COLUMN IF NOT EXISTS overlay_color VARCHAR(20) NOT NULL DEFAULT '#0f2f5f';
-- One highlight per line, e.g. "Express Food Group\nPalms Food International\nHotels"
ALTER TABLE industries ADD COLUMN IF NOT EXISTS description   TEXT;
ALTER TABLE industries ADD COLUMN IF NOT EXISTS explore_link  VARCHAR(255);
ALTER TABLE industries ADD COLUMN IF NOT EXISTS is_active     BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE industries ADD COLUMN IF NOT EXISTS created_at    TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE industries ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ NOT NULL DEFAULT now();

-- Give existing rows a sensible display number ("01", "02", ...) if they
-- don't have one yet, so the slider isn't missing its big number badge.
UPDATE industries
SET number = lpad(sort_order::text, 2, '0')
WHERE number IS NULL;
