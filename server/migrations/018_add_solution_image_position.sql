-- Migration 018 — Solution Block image positioning.
--
-- Adds image_position_x / image_position_y to `solutions`: the
-- object-position-style crop point (0–100, percent from left/top)
-- an admin picks by dragging the uploaded image inside the fixed
-- Solution Block frame. The public Automation Solution page applies
-- the same percentage with the same aspect-ratio frame + object-fit:
-- cover, so the admin preview and the live site always match. The
-- original uploaded file (image_url) is never modified — only this
-- crop point is stored.
--
-- Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/018_add_solution_image_position.sql

ALTER TABLE solutions ADD COLUMN IF NOT EXISTS image_position_x SMALLINT NOT NULL DEFAULT 50;
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS image_position_y SMALLINT NOT NULL DEFAULT 50;

ALTER TABLE solutions DROP CONSTRAINT IF EXISTS solutions_image_position_x_check;
ALTER TABLE solutions ADD CONSTRAINT solutions_image_position_x_check
  CHECK (image_position_x BETWEEN 0 AND 100);

ALTER TABLE solutions DROP CONSTRAINT IF EXISTS solutions_image_position_y_check;
ALTER TABLE solutions ADD CONSTRAINT solutions_image_position_y_check
  CHECK (image_position_y BETWEEN 0 AND 100);
