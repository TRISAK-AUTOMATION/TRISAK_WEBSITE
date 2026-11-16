-- Migration 047 — Contact Us page extras (Admin > แก้ไข > Contact Us).
-- Every block only renders on the public page when it has content.
--
--   line_qr_image                  LINE OA QR code image (uploaded)
--   support_phone / support_email  Technical support line
--   accounting_phone / _email      Accounting / billing line
--   company_name_en / _th, tax_id  Registered entity, for vendor registration
--   vendor_docs   TEXT (JSON)      [{ "label_en", "label_th", "url" }] public PDFs
--   faq           TEXT (JSON)      [{ "q_en", "q_th", "a_en", "a_th" }]
--   head_office_photo / warehouse_photo  building photo for each location card
--
-- Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/047_contacts_page_extras.sql

ALTER TABLE contacts_page_content
  ADD COLUMN IF NOT EXISTS line_qr_image      VARCHAR(255),
  ADD COLUMN IF NOT EXISTS support_phone      VARCHAR(50),
  ADD COLUMN IF NOT EXISTS support_email      VARCHAR(150),
  ADD COLUMN IF NOT EXISTS accounting_phone   VARCHAR(50),
  ADD COLUMN IF NOT EXISTS accounting_email   VARCHAR(150),
  ADD COLUMN IF NOT EXISTS company_name_en    VARCHAR(255),
  ADD COLUMN IF NOT EXISTS company_name_th    VARCHAR(255),
  ADD COLUMN IF NOT EXISTS tax_id             VARCHAR(30),
  ADD COLUMN IF NOT EXISTS vendor_docs        TEXT,
  ADD COLUMN IF NOT EXISTS faq                TEXT,
  ADD COLUMN IF NOT EXISTS head_office_photo  VARCHAR(255),
  ADD COLUMN IF NOT EXISTS warehouse_photo    VARCHAR(255);
