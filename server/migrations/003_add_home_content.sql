-- Migration 003 — adds the home_content table so the Home page's Hero,
-- "Our Strength" blocks, and CTA text can be edited from the admin
-- panel instead of being hardcoded in the frontend.
--
-- Safe to run more than once — the seed INSERT is skipped if a row
-- already exists.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/003_add_home_content.sql

CREATE TABLE IF NOT EXISTS home_content (
  id                     SERIAL PRIMARY KEY,
  hero_meta_en           VARCHAR(255),
  hero_meta_th           VARCHAR(255),
  hero_title_line1_en    VARCHAR(255),
  hero_title_line1_th    VARCHAR(255),
  hero_title_line2_en    VARCHAR(255),
  hero_title_line2_th    VARCHAR(255),
  hero_sub_en            TEXT,
  hero_sub_th            TEXT,
  strength1_title_en     VARCHAR(255),
  strength1_title_th     VARCHAR(255),
  strength1_body_en      TEXT,
  strength1_body_th      TEXT,
  strength2_title_en     VARCHAR(255),
  strength2_title_th     VARCHAR(255),
  strength2_body_en      TEXT,
  strength2_body_th      TEXT,
  strength3_title_en     VARCHAR(255),
  strength3_title_th     VARCHAR(255),
  strength3_body_en      TEXT,
  strength3_body_th      TEXT,
  cta_title_line1_en     VARCHAR(255),
  cta_title_line1_th     VARCHAR(255),
  cta_title_line2_en     VARCHAR(255),
  cta_title_line2_th     VARCHAR(255),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO home_content (
  hero_meta_en, hero_meta_th,
  hero_title_line1_en, hero_title_line1_th,
  hero_title_line2_en, hero_title_line2_th,
  hero_sub_en, hero_sub_th,
  strength1_title_en, strength1_title_th, strength1_body_en, strength1_body_th,
  strength2_title_en, strength2_title_th, strength2_body_en, strength2_body_th,
  strength3_title_en, strength3_title_th, strength3_body_en, strength3_body_th,
  cta_title_line1_en, cta_title_line1_th,
  cta_title_line2_en, cta_title_line2_th
)
SELECT
  'Authorized Automation Products & Engineering Solutions',
  'ตัวแทนจำหน่ายสินค้าออโตเมชันและผู้ให้บริการโซลูชันวิศวกรรม',
  'Industrial Automation &',
  'ระบบอัตโนมัติทางอุตสาหกรรม &',
  'Engineering Solutions',
  'โซลูชันด้านวิศวกรรม',
  'TRISAK GROUP supplies genuine automation products and delivers engineering solutions built to keep your production running.',
  'TRISAK GROUP จำหน่ายสินค้าออโตเมชันของแท้ พร้อมให้บริการโซลูชันวิศวกรรมที่ออกแบบมาเพื่อให้สายการผลิตของคุณเดินเครื่องได้อย่างต่อเนื่อง',
  'Authorized Distributor', 'ตัวแทนจำหน่ายที่ได้รับการแต่งตั้ง',
  'Genuine automation products sourced directly from OMRON, YASKAWA, and NITTO.',
  'สินค้าออโตเมชันของแท้ นำเข้าโดยตรงจาก OMRON, YASKAWA และ NITTO',
  'Engineering Solution', 'โซลูชันด้านวิศวกรรม',
  'Design, integration, and commissioning built around your process, not off a shelf.',
  'ออกแบบ ติดตั้ง และปรับแต่งระบบให้เหมาะกับกระบวนการผลิตของคุณโดยเฉพาะ ไม่ใช่สินค้าสำเร็จรูป',
  'Technical Support', 'ทีมสนับสนุนด้านเทคนิค',
  'On-site and remote support from engineers who know the equipment first-hand.',
  'ทีมวิศวกรที่รู้จักอุปกรณ์เป็นอย่างดี พร้อมให้บริการทั้งหน้างานและระยะไกล',
  'Ready to Improve', 'พร้อมยกระดับ',
  'Your Automation?', 'ระบบอัตโนมัติของคุณหรือยัง?'
WHERE NOT EXISTS (SELECT 1 FROM home_content);
