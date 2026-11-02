-- Migration 034 — Automation Solutions cards (Home page) become admin-managed.
--
-- The four cards of the Home page's "Automation Solutions" section (number,
-- title, description, three feature labels + icons, picture, link, on/off)
-- used to be hardcoded in the frontend. They now live in `automation_pillars`
-- and are edited from Admin > Home (/admin/home) > "Automation Solutions
-- Management".
--
--   title / description / image_alt   English; *_th are the Thai versions —
--                                     independently editable, and the public
--                                     site falls back to English when a Thai
--                                     field is blank.
--   features   JSON list (max 3) of { "label", "labelTh", "icon" }. `icon` is
--              either a key from the icon library (client/src/components/
--              featureIcons.jsx) or the URL of an uploaded icon image.
--   number     the card's displayed number ("01"); blank = its position.
--   sort_order display order — changed only through the reorder endpoint.
--
-- Seeded with exactly the content the Home page showed before this change
-- (pictures: client/public/images/solutions/), only when the table is empty,
-- so re-running never overwrites admin edits.
--
-- Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak -f migrations/034_automation_pillars.sql

CREATE TABLE IF NOT EXISTS automation_pillars (
  id              SERIAL PRIMARY KEY,
  number          VARCHAR(10),
  title           VARCHAR(100) NOT NULL,
  title_th        VARCHAR(100),
  description     TEXT NOT NULL DEFAULT '',
  description_th  TEXT,
  features        JSONB NOT NULL DEFAULT '[]'::jsonb,
  image_url       VARCHAR(255),
  image_alt       VARCHAR(200),
  image_alt_th    VARCHAR(200),
  -- which part of the picture stays visible when it is cropped to fit (0–100 %,
  -- like CSS object-position); set by dragging in the admin
  image_position_x SMALLINT NOT NULL DEFAULT 50 CHECK (image_position_x BETWEEN 0 AND 100),
  image_position_y SMALLINT NOT NULL DEFAULT 50 CHECK (image_position_y BETWEEN 0 AND 100),
  link_url        VARCHAR(255) NOT NULL DEFAULT '/automation-solution',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO automation_pillars
  (number, title, title_th, description, description_th, features, image_url, image_alt, image_alt_th, link_url, sort_order, image_position_x, image_position_y)
SELECT * FROM (VALUES
  ('01', 'HMI & PLC Solutions', 'โซลูชัน HMI และ PLC',
   'Intuitive interfaces and reliable control systems for smarter, more efficient operations.',
   'หน้าจอควบคุมที่ใช้งานง่ายและระบบควบคุมที่เชื่อถือได้ เพื่อการทำงานที่ชาญฉลาดและมีประสิทธิภาพยิ่งขึ้น',
   '[{"label":"HMI","labelTh":"HMI","icon":"monitor"},{"label":"PLC","labelTh":"PLC","icon":"chip"},{"label":"SCADA","labelTh":"SCADA","icon":"dashboard"}]'::jsonb,
   '/images/solutions/hmi-plc.webp',
   'Industrial HMI touchscreen next to PLC controllers',
   'หน้าจอสัมผัส HMI อุตสาหกรรมและตัวควบคุม PLC',
   '/automation-solution', 1, 40, 50),
  ('02', 'Drive & Motion', 'ระบบขับเคลื่อนและมอเตอร์',
   'Precision motion control for higher productivity and optimal performance.',
   'ระบบควบคุมการเคลื่อนที่อย่างแม่นยำ เพื่อผลผลิตที่สูงขึ้นและประสิทธิภาพที่ดีที่สุด',
   '[{"label":"Servo Drive","labelTh":"เซอร์โวไดรฟ์","icon":"servo-drive"},{"label":"Servo Motor","labelTh":"เซอร์โวมอเตอร์","icon":"servo-motor"},{"label":"Motion Control","labelTh":"ระบบควบคุมการเคลื่อนที่","icon":"motion"}]'::jsonb,
   '/images/solutions/drive-motion.webp',
   'Industrial servo drives and a servo motor',
   'เซอร์โวไดรฟ์และเซอร์โวมอเตอร์อุตสาหกรรม',
   '/automation-solution', 2, 58, 50),
  ('03', 'Robotic Solutions', 'โซลูชันหุ่นยนต์อุตสาหกรรม',
   'Flexible and intelligent robots for assembly, handling, and advanced manufacturing.',
   'หุ่นยนต์ที่ยืดหยุ่นและชาญฉลาด สำหรับงานประกอบ งานหยิบจับ และการผลิตขั้นสูง',
   '[{"label":"Industrial Robots","labelTh":"หุ่นยนต์อุตสาหกรรม","icon":"robot-arm"},{"label":"Collaborative Robots","labelTh":"หุ่นยนต์ทำงานร่วมกับคน","icon":"cobot"},{"label":"System Integration","labelTh":"การบูรณาการระบบ","icon":"gear"}]'::jsonb,
   '/images/solutions/robotics.webp',
   'White industrial robot arm in a modern factory',
   'แขนหุ่นยนต์อุตสาหกรรมสีขาวในโรงงานทันสมัย',
   '/automation-solution', 3, 38, 50),
  ('04', 'Smart Factory', 'โรงงานอัจฉริยะ',
   'Connected technologies for real-time data, greater visibility, and a smarter production floor.',
   'เทคโนโลยีที่เชื่อมต่อถึงกัน เพื่อข้อมูลแบบเรียลไทม์ มองเห็นภาพรวมชัดเจน และไลน์ผลิตที่ชาญฉลาดยิ่งขึ้น',
   '[{"label":"IoT & IIoT","labelTh":"IoT และ IIoT","icon":"cloud"},{"label":"Data Analytics","labelTh":"การวิเคราะห์ข้อมูล","icon":"database"},{"label":"MES Integration","labelTh":"การเชื่อมต่อ MES","icon":"network-nodes"}]'::jsonb,
   '/images/solutions/smart-factory.webp',
   'Digital dashboard above a connected production line',
   'แดชบอร์ดดิจิทัลเหนือไลน์การผลิตที่เชื่อมต่อกัน',
   '/automation-solution', 4, 82, 50)
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM automation_pillars);
