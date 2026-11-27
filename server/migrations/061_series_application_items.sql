-- Suitable applications become cards with a picture: [{ image, title_en, title_th }].
-- Copies the old one-per-line applications_en / applications_th text (paired by line).
ALTER TABLE series ADD COLUMN IF NOT EXISTS application_items JSONB NOT NULL DEFAULT '[]'::jsonb;

WITH en AS (
  SELECT s.id, btrim(r.x) AS t, row_number() OVER (PARTITION BY s.id ORDER BY r.o) AS n
  FROM series s, regexp_split_to_table(COALESCE(s.applications_en, ''), E'\r?\n') WITH ORDINALITY AS r(x, o)
  WHERE btrim(r.x) <> ''
), th AS (
  SELECT s.id, btrim(r.x) AS t, row_number() OVER (PARTITION BY s.id ORDER BY r.o) AS n
  FROM series s, regexp_split_to_table(COALESCE(s.applications_th, ''), E'\r?\n') WITH ORDINALITY AS r(x, o)
  WHERE btrim(r.x) <> ''
), items AS (
  SELECT COALESCE(en.id, th.id) AS id,
         jsonb_agg(jsonb_build_object('image', '', 'title_en', COALESCE(en.t, ''), 'title_th', COALESCE(th.t, ''))
                   ORDER BY COALESCE(en.n, th.n)) AS j
  FROM en FULL JOIN th ON th.id = en.id AND th.n = en.n
  GROUP BY 1
)
UPDATE series SET application_items = items.j
FROM items
WHERE series.id = items.id AND series.application_items = '[]'::jsonb;
