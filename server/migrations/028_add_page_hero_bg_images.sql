-- Adds independent optional Hero background images for the three page
-- content records that already back the public Products, Contacts, and
-- Automation Solution pages. NULL/empty retains each page's existing
-- non-image Hero treatment.
--
-- Safe to run more than once.

ALTER TABLE products_page_content
  ADD COLUMN IF NOT EXISTS hero_bg_image VARCHAR(255);

ALTER TABLE contacts_page_content
  ADD COLUMN IF NOT EXISTS hero_bg_image VARCHAR(255);

ALTER TABLE automation_solution_page_content
  ADD COLUMN IF NOT EXISTS hero_bg_image VARCHAR(255);
