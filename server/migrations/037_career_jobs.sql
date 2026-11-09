-- Migration 037 — Career page job positions become admin-managed.
--
-- The open positions on /career used to be hardcoded in the frontend
-- (client/src/data/careerJobs.js). They now live in `career_jobs` and are
-- edited from Admin > ตำแหน่งงาน (/admin/career).
--
--   *_en / *_th        bilingual text; the public page falls back to the other
--                      language when one is blank.
--   responsibilities / requirements / benefits
--                      JSON lists of { "en", "th" }.
--   is_active          hidden from the public page when false.
--   sort_order         display order — changed through the reorder endpoint.
--
-- Seeded with the (sample) jobs the page showed before, only when the table is
-- empty, so re-running never overwrites admin edits. Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak -f migrations/037_career_jobs.sql

CREATE TABLE IF NOT EXISTS career_jobs (
  id                SERIAL PRIMARY KEY,
  title_en          VARCHAR(200),
  title_th          VARCHAR(200),
  location_en       VARCHAR(200),
  location_th       VARCHAR(200),
  salary_en         VARCHAR(100),
  salary_th         VARCHAR(100),
  job_type_en       VARCHAR(100),
  job_type_th       VARCHAR(100),
  summary_en        TEXT,
  summary_th        TEXT,
  responsibilities  JSONB NOT NULL DEFAULT '[]'::jsonb,
  requirements      JSONB NOT NULL DEFAULT '[]'::jsonb,
  benefits          JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO career_jobs
  (title_en, title_th, location_en, location_th, salary_en, salary_th, job_type_en, job_type_th,
   summary_en, summary_th, responsibilities, requirements, benefits, is_active, sort_order)
SELECT * FROM (VALUES
  ('Sales Engineer', 'วิศวกรฝ่ายขาย (Sales Engineer)', 'Bangkok', 'กรุงเทพมหานคร', '25,000 – 40,000 THB', '25,000 – 40,000 บาท', 'Full-time', 'งานประจำ', 'Present automation solutions and industrial equipment to factory customers, look after existing accounts and grow new ones, and work with our engineering team to build proposals that fit each customer''s needs.', 'นำเสนอโซลูชันระบบอัตโนมัติและอุปกรณ์อุตสาหกรรมให้ลูกค้าในกลุ่มโรงงาน ดูแลลูกค้าเดิมและขยายฐานลูกค้าใหม่ ทำงานร่วมกับทีมวิศวกรเพื่อออกแบบข้อเสนอที่ตรงความต้องการ พร้อมติดตามยอดขายตามเป้าหมาย',
   '[{"en":"Present products and solutions to industrial customers","th":"นำเสนอสินค้าและโซลูชันให้ลูกค้ากลุ่มโรงงานอุตสาหกรรม"},{"en":"Manage existing accounts and develop new customers in your territory","th":"ดูแลลูกค้าเดิมและหาลูกค้ารายใหม่ตามพื้นที่ที่รับผิดชอบ"},{"en":"Prepare quotations and follow up orders through to closing","th":"จัดทำใบเสนอราคาและติดตามการสั่งซื้อจนปิดการขาย"},{"en":"Coordinate with engineers on technical proposals","th":"ประสานงานกับทีมวิศวกรเพื่อออกแบบข้อเสนอทางเทคนิค"},{"en":"Report monthly sales and plans to management","th":"รายงานยอดขายและแผนงานประจำเดือนต่อผู้บังคับบัญชา"}]'::jsonb,
   '[{"en":"Bachelor''s degree in Electrical, Mechanical, Industrial Engineering or a related field","th":"ปริญญาตรี วิศวกรรมไฟฟ้า เครื่องกล อุตสาหการ หรือสาขาที่เกี่ยวข้อง"},{"en":"1+ year of technical sales experience (new graduates welcome)","th":"มีประสบการณ์ด้านงานขายเชิงเทคนิค 1 ปีขึ้นไป (ยินดีรับนักศึกษาจบใหม่)"},{"en":"Good communication and presentation skills","th":"มีทักษะการสื่อสารและการนำเสนอที่ดี"},{"en":"Driving license; able to travel to customers upcountry","th":"มีใบขับขี่รถยนต์ และสามารถเดินทางไปพบลูกค้าต่างจังหวัดได้"},{"en":"Working English is a plus","th":"ใช้ภาษาอังกฤษในการสื่อสารได้ จะพิจารณาเป็นพิเศษ"}]'::jsonb,
   '[{"en":"Social security","th":"ประกันสังคม"},{"en":"Group health and accident insurance","th":"ประกันสุขภาพกลุ่มและประกันอุบัติเหตุ"},{"en":"Annual bonus based on company performance","th":"โบนัสประจำปีตามผลประกอบการ"},{"en":"Annual salary review","th":"ปรับเงินเดือนประจำปี"},{"en":"Provident fund","th":"กองทุนสำรองเลี้ยงชีพ"},{"en":"Annual paid leave","th":"วันหยุดพักร้อนประจำปี"},{"en":"Company uniform","th":"ชุดยูนิฟอร์มพนักงาน"},{"en":"Training and skill development","th":"งานอบรมพัฒนาทักษะ"},{"en":"Sales commission","th":"ค่าคอมมิชชัน"},{"en":"Fuel and phone allowance","th":"ค่าน้ำมันและค่าโทรศัพท์"}]'::jsonb,
   true, 1),
  ('Automation Engineer', 'วิศวกรระบบอัตโนมัติ (Automation Engineer)', 'Samut Prakan', 'สมุทรปราการ', '30,000 – 45,000 THB', '30,000 – 45,000 บาท', 'Full-time', 'งานประจำ', 'Design, program and install PLC, HMI and SCADA control systems for customers'' production lines, commission them on site, solve problems and hand over with complete documentation.', 'ออกแบบ เขียนโปรแกรม และติดตั้งระบบควบคุมอัตโนมัติด้วย PLC, HMI และ SCADA สำหรับสายการผลิตของลูกค้า ทดสอบระบบหน้างาน แก้ไขปัญหา และส่งมอบงานพร้อมเอกสารครบถ้วน',
   '[{"en":"Design electrical control and automation systems to customer requirements","th":"ออกแบบระบบควบคุมไฟฟ้าและระบบอัตโนมัติตามความต้องการของลูกค้า"},{"en":"Program PLC, HMI and SCADA","th":"เขียนโปรแกรม PLC, HMI และ SCADA"},{"en":"Install, test and commission systems on site","th":"ติดตั้ง ทดสอบ และ Commissioning ระบบที่หน้างาน"},{"en":"Troubleshoot technical issues and advise customers","th":"แก้ไขปัญหาทางเทคนิคและให้คำแนะนำแก่ลูกค้า"},{"en":"Prepare electrical drawings and user manuals","th":"จัดทำเอกสารแบบไฟฟ้าและคู่มือการใช้งานระบบ"}]'::jsonb,
   '[{"en":"Bachelor''s degree in Electrical, Mechatronics Engineering or a related field","th":"ปริญญาตรี วิศวกรรมไฟฟ้า เมคคาทรอนิกส์ หรือสาขาที่เกี่ยวข้อง"},{"en":"2+ years of PLC programming experience","th":"มีประสบการณ์เขียนโปรแกรม PLC 2 ปีขึ้นไป"},{"en":"Able to read and draw electrical diagrams (AutoCAD or EPLAN)","th":"อ่านและเขียนแบบไฟฟ้าได้ ใช้ AutoCAD หรือ EPLAN ได้"},{"en":"Able to work on customer sites","th":"สามารถเดินทางไปปฏิบัติงานที่หน้างานลูกค้าได้"},{"en":"Professional engineering license is a plus","th":"มีใบอนุญาตประกอบวิชาชีพวิศวกรรม (กว.) จะพิจารณาเป็นพิเศษ"}]'::jsonb,
   '[{"en":"Social security","th":"ประกันสังคม"},{"en":"Group health and accident insurance","th":"ประกันสุขภาพกลุ่มและประกันอุบัติเหตุ"},{"en":"Annual bonus based on company performance","th":"โบนัสประจำปีตามผลประกอบการ"},{"en":"Annual salary review","th":"ปรับเงินเดือนประจำปี"},{"en":"Provident fund","th":"กองทุนสำรองเลี้ยงชีพ"},{"en":"Annual paid leave","th":"วันหยุดพักร้อนประจำปี"},{"en":"Company uniform","th":"ชุดยูนิฟอร์มพนักงาน"},{"en":"Training and skill development","th":"งานอบรมพัฒนาทักษะ"},{"en":"On-site allowance","th":"เบี้ยเลี้ยงออกหน้างาน"}]'::jsonb,
   true, 2),
  ('Service Technician', 'ช่างเทคนิคบริการ (Service Technician)', 'Chonburi', 'ชลบุรี', '18,000 – 25,000 THB', '18,000 – 25,000 บาท', 'Full-time', 'งานประจำ', 'Install, repair and carry out preventive maintenance on machines and equipment at customer sites, finding the root cause of problems quickly so customers'' production lines keep running.', 'ติดตั้ง ซ่อมบำรุง และบำรุงรักษาเชิงป้องกันเครื่องจักรและอุปกรณ์ที่หน้างานลูกค้า ตรวจหาสาเหตุของปัญหาและแก้ไขอย่างรวดเร็ว เพื่อให้สายการผลิตของลูกค้าทำงานต่อเนื่อง',
   '[{"en":"Install and test equipment at customer sites","th":"ติดตั้งและทดสอบอุปกรณ์ที่หน้างานลูกค้า"},{"en":"Repair and troubleshoot machines on request","th":"ซ่อมบำรุงและแก้ไขปัญหาเครื่องจักรตามที่ได้รับแจ้ง"},{"en":"Carry out preventive maintenance plans","th":"ทำแผนบำรุงรักษาเชิงป้องกัน (Preventive Maintenance)"},{"en":"Record service reports and spare parts used","th":"บันทึกรายงานการบริการและอะไหล่ที่ใช้"},{"en":"Give customers basic operating guidance","th":"ให้คำแนะนำการใช้งานอุปกรณ์เบื้องต้นแก่ลูกค้า"}]'::jsonb,
   '[{"en":"Vocational diploma or higher in Electrical, Electronics or Mechanical","th":"ปวส. ขึ้นไป สาขาไฟฟ้า อิเล็กทรอนิกส์ หรือเครื่องกล"},{"en":"1+ year of maintenance experience","th":"มีประสบการณ์ด้านงานซ่อมบำรุง 1 ปีขึ้นไป"},{"en":"Able to read basic electrical diagrams","th":"อ่านแบบไฟฟ้าเบื้องต้นได้"},{"en":"Driving license","th":"มีใบขับขี่รถยนต์"},{"en":"Hard-working, patient and a good team player","th":"ขยัน อดทน และทำงานเป็นทีมได้ดี"}]'::jsonb,
   '[{"en":"Social security","th":"ประกันสังคม"},{"en":"Group health and accident insurance","th":"ประกันสุขภาพกลุ่มและประกันอุบัติเหตุ"},{"en":"Annual bonus based on company performance","th":"โบนัสประจำปีตามผลประกอบการ"},{"en":"Annual salary review","th":"ปรับเงินเดือนประจำปี"},{"en":"Provident fund","th":"กองทุนสำรองเลี้ยงชีพ"},{"en":"Annual paid leave","th":"วันหยุดพักร้อนประจำปี"},{"en":"Company uniform","th":"ชุดยูนิฟอร์มพนักงาน"},{"en":"Training and skill development","th":"งานอบรมพัฒนาทักษะ"},{"en":"Overtime pay","th":"ค่าล่วงเวลา"},{"en":"On-site allowance","th":"เบี้ยเลี้ยงออกหน้างาน"}]'::jsonb,
   true, 3),
  ('Purchasing Officer', 'เจ้าหน้าที่จัดซื้อ (Purchasing Officer)', 'Bangkok', 'กรุงเทพมหานคร', '20,000 – 28,000 THB', '20,000 – 28,000 บาท', 'Full-time', 'งานประจำ', 'Source and purchase goods, equipment and materials from local and overseas suppliers, compare prices and terms, follow up deliveries and keep the supplier database up to date.', 'จัดหาและสั่งซื้อสินค้า อุปกรณ์ และวัตถุดิบจากผู้ขายทั้งในและต่างประเทศ เปรียบเทียบราคาและเงื่อนไข ติดตามการส่งมอบให้ตรงเวลา และดูแลฐานข้อมูลผู้ขายให้เป็นปัจจุบัน',
   '[{"en":"Prepare purchase requisitions and purchase orders","th":"จัดทำใบขอซื้อและใบสั่งซื้อตามความต้องการของฝ่ายต่าง ๆ"},{"en":"Source and compare quotes from multiple suppliers","th":"สรรหาและเปรียบเทียบราคาจากผู้ขายหลายราย"},{"en":"Follow up deliveries and coordinate imports","th":"ติดตามการส่งมอบสินค้าและประสานงานนำเข้า"},{"en":"Maintain the supplier database","th":"ดูแลและปรับปรุงฐานข้อมูลผู้ขาย"},{"en":"Evaluate supplier performance regularly","th":"ประเมินผลการทำงานของผู้ขายเป็นประจำ"}]'::jsonb,
   '[{"en":"Bachelor''s degree in Business Administration, Logistics or a related field","th":"ปริญญาตรี สาขาบริหารธุรกิจ โลจิสติกส์ หรือสาขาที่เกี่ยวข้อง"},{"en":"1+ year of purchasing experience","th":"มีประสบการณ์ด้านงานจัดซื้อ 1 ปีขึ้นไป"},{"en":"Proficient in Microsoft Office and ERP systems","th":"ใช้ Microsoft Office และระบบ ERP ได้"},{"en":"Good English communication","th":"สื่อสารภาษาอังกฤษได้ดี"},{"en":"Strong negotiation skills and attention to detail","th":"มีทักษะการเจรจาต่อรอง ละเอียดรอบคอบ"}]'::jsonb,
   '[{"en":"Social security","th":"ประกันสังคม"},{"en":"Group health and accident insurance","th":"ประกันสุขภาพกลุ่มและประกันอุบัติเหตุ"},{"en":"Annual bonus based on company performance","th":"โบนัสประจำปีตามผลประกอบการ"},{"en":"Annual salary review","th":"ปรับเงินเดือนประจำปี"},{"en":"Provident fund","th":"กองทุนสำรองเลี้ยงชีพ"},{"en":"Annual paid leave","th":"วันหยุดพักร้อนประจำปี"},{"en":"Company uniform","th":"ชุดยูนิฟอร์มพนักงาน"},{"en":"Training and skill development","th":"งานอบรมพัฒนาทักษะ"}]'::jsonb,
   true, 4)
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM career_jobs);
