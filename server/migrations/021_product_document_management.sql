-- Migration 021 — Product PDF Document Management.
--
-- Upgrades product_documents from a plain label+URL row (filled in by hand
-- on the product form) into proper file metadata for uploaded PDFs, used by
-- the dedicated /admin/products/:productId/documents endpoints.
--
--   label     -> title
--   doc_type  -> document_type  (now a fixed category list, see below)
--   + file_name, file_size, mime_type, created_at, updated_at
--
-- Existing rows are kept and best-effort classified into the new category
-- list from their old title/doc_type. Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/021_product_document_management.sql

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'product_documents' AND column_name = 'label')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'product_documents' AND column_name = 'title') THEN
    ALTER TABLE product_documents RENAME COLUMN label TO title;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'product_documents' AND column_name = 'doc_type')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'product_documents' AND column_name = 'document_type') THEN
    ALTER TABLE product_documents RENAME COLUMN doc_type TO document_type;
  END IF;
END $$;

ALTER TABLE product_documents ADD COLUMN IF NOT EXISTS file_name  VARCHAR(255);
ALTER TABLE product_documents ADD COLUMN IF NOT EXISTS file_size  BIGINT;
ALTER TABLE product_documents ADD COLUMN IF NOT EXISTS mime_type  VARCHAR(100);
ALTER TABLE product_documents ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE product_documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Best-effort classification of pre-existing rows into the new category
-- list (old doc_type held 'pdf' | 'doc' | 'link' — a file kind, not this).
UPDATE product_documents
SET document_type = CASE
  WHEN title ILIKE '%datasheet%'    THEN 'Datasheet'
  WHEN title ILIKE '%install%'      THEN 'Installation Manual'
  WHEN title ILIKE '%manual%'       THEN 'User Manual'
  WHEN title ILIKE '%catalog%'      THEN 'Catalog'
  WHEN title ILIKE '%technical%'    THEN 'Technical Document'
  ELSE 'Other'
END
WHERE document_type IS NULL
   OR document_type NOT IN ('Datasheet', 'User Manual', 'Installation Manual', 'Catalog', 'Technical Document', 'Other');

UPDATE product_documents SET file_name = split_part(file_url, '/', -1) WHERE file_name IS NULL;

ALTER TABLE product_documents ALTER COLUMN document_type SET DEFAULT 'Other';
ALTER TABLE product_documents ALTER COLUMN document_type SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_documents_document_type_check') THEN
    ALTER TABLE product_documents ADD CONSTRAINT product_documents_document_type_check
      CHECK (document_type IN ('Datasheet', 'User Manual', 'Installation Manual', 'Catalog', 'Technical Document', 'Other'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_product_documents_product_id ON product_documents (product_id);
