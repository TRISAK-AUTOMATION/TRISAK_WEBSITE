-- Migration 027 — Thai content for Automation Solution blocks.
-- Existing columns remain the English/canonical values, preserving current data.
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS name_th VARCHAR(255);
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS summary_th TEXT;
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS services_th TEXT[];
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS benefits_th TEXT[];
