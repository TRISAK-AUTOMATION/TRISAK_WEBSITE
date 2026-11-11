-- Migration 042 — store uploaded-file URLs as site-relative paths.
--
-- Uploads used to be saved as absolute URLs built from the request host
-- (e.g. http://192.168.1.111:4000/uploads/x.jpg), which break as soon as the
-- site is opened from any other address (public domain, another LAN IP).
-- New uploads are stored as /uploads/x.jpg; this rewrites the old ones in
-- every text/json column of the public schema.
--
-- Safe to run more than once.

DO $$
DECLARE
  col record;
BEGIN
  FOR col IN
    SELECT c.table_name, c.column_name, c.data_type
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema AND t.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND c.data_type IN ('text', 'character varying', 'json', 'jsonb')
      AND c.is_generated = 'NEVER'
  LOOP
    EXECUTE format(
      'UPDATE %I SET %I = regexp_replace(%I::text, ''https?://[^/"\s]+(/uploads/)'', ''\1'', ''g'')::%s
       WHERE %I::text ~ ''https?://[^/"\s]+/uploads/''',
      col.table_name, col.column_name, col.column_name,
      CASE col.data_type WHEN 'character varying' THEN 'text' ELSE col.data_type END,
      col.column_name
    );
  END LOOP;
END $$;
