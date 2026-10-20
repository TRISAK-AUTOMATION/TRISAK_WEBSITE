-- Migration 025 — Admin-editable History page sections.
--
-- The HISTORY page's Company History Timeline, Company Statistics and
-- Organization Structure used to be hardcoded in the front-end
-- translations. This creates one table per section and copies the
-- existing built-in content into them so the public page looks the
-- same straight after upgrading.
--
--   history_timeline   timeline entries (EN/TH year, title, description, optional image)
--   history_stats      statistics (EN/TH label, value, optional EN/TH unit/suffix)
--   history_org_nodes  organization chart nodes (parent_id builds the tree)
--
-- Safe to run more than once: tables use IF NOT EXISTS and the seed rows
-- are only inserted while the target table is still completely empty, so
-- re-running never duplicates or overwrites anything an admin has edited.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/025_history_content.sql

CREATE TABLE IF NOT EXISTS history_timeline (
  id              SERIAL PRIMARY KEY,
  year_en         VARCHAR(100) NOT NULL,
  year_th         VARCHAR(100),
  title_en        VARCHAR(255) NOT NULL,
  title_th        VARCHAR(255),
  description_en  TEXT,
  description_th  TEXT,
  image_url       VARCHAR(255),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS history_stats (
  id          SERIAL PRIMARY KEY,
  label_en    VARCHAR(150) NOT NULL,
  label_th    VARCHAR(150),
  value       VARCHAR(50) NOT NULL,
  unit_en     VARCHAR(30),
  unit_th     VARCHAR(30),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- parent_id NULL = top-level node. ON DELETE RESTRICT: a node that still
-- has children can't be removed by accident (the admin API also checks).
CREATE TABLE IF NOT EXISTS history_org_nodes (
  id          SERIAL PRIMARY KEY,
  parent_id   INTEGER REFERENCES history_org_nodes(id) ON DELETE RESTRICT,
  name_en     VARCHAR(150) NOT NULL,
  name_th     VARCHAR(150),
  person_en   VARCHAR(150),
  person_th   VARCHAR(150),
  image_url   VARCHAR(255),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_history_org_nodes_parent ON history_org_nodes(parent_id);

-- ---- seed: current built-in content (only into empty tables) ----

INSERT INTO history_timeline (year_en, year_th, title_en, title_th, description_en, description_th, sort_order)
SELECT * FROM (VALUES
  ('Founding', 'ก่อตั้ง',
   'TRISAK GROUP established', 'ก่อตั้ง TRISAK GROUP',
   'Founded as an authorized distributor of industrial automation products, serving Thailand''s manufacturing sector.',
   'ก่อตั้งขึ้นในฐานะตัวแทนจำหน่ายสินค้าออโตเมชันทางอุตสาหกรรม ให้บริการภาคการผลิตของประเทศไทย', 1),
  ('Expansion', 'ขยายธุรกิจ',
   'Engineering solutions division launched', 'เปิดฝ่ายโซลูชันด้านวิศวกรรม',
   'Grew beyond distribution into system design, integration, and commissioning services.',
   'ขยายธุรกิจจากการจำหน่ายสินค้า สู่บริการออกแบบระบบ ติดตั้ง และทดสอบระบบ', 2),
  ('Partnership', 'พันธมิตร',
   'Authorized partnerships with OMRON, YASKAWA, NITTO', 'ได้รับการแต่งตั้งเป็นตัวแทนจำหน่ายจาก OMRON, YASKAWA, NITTO',
   'Formalized as an authorized distributor for leading global automation brands.',
   'ได้รับการรับรองอย่างเป็นทางการในฐานะตัวแทนจำหน่ายแบรนด์ออโตเมชันชั้นนำระดับโลก', 3),
  ('Today', 'ปัจจุบัน',
   'One-stop automation partner', 'พันธมิตรด้านระบบอัตโนมัติแบบครบวงจร',
   'Combining authorized distribution, engineering solutions, and technical support under one roof.',
   'ผนวกรวมการจำหน่ายสินค้า โซลูชันด้านวิศวกรรม และการสนับสนุนด้านเทคนิคไว้ในที่เดียว', 4)
) AS v(year_en, year_th, title_en, title_th, description_en, description_th, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM history_timeline);

INSERT INTO history_stats (label_en, label_th, value, sort_order)
SELECT * FROM (VALUES
  ('Authorized Brands', 'แบรนด์ที่ได้รับการแต่งตั้ง', '3', 1),
  ('Solution Pillars', 'กลุ่มโซลูชันหลัก', '4', 2),
  ('Industries Served', 'กลุ่มอุตสาหกรรมที่ให้บริการ', '8', 3)
) AS v(label_en, label_th, value, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM history_stats);

DO $$
DECLARE
  root_id INTEGER;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM history_org_nodes) THEN
    INSERT INTO history_org_nodes (parent_id, name_en, name_th, sort_order)
    VALUES (NULL, 'TRISAK GROUP', 'TRISAK GROUP', 1)
    RETURNING id INTO root_id;

    INSERT INTO history_org_nodes (parent_id, name_en, name_th, sort_order) VALUES
      (root_id, 'Products Distribution', 'ฝ่ายจำหน่ายสินค้า', 1),
      (root_id, 'Engineering Solutions', 'ฝ่ายโซลูชันวิศวกรรม', 2),
      (root_id, 'Technical Support', 'ฝ่ายสนับสนุนด้านเทคนิค', 3);
  END IF;
END $$;
