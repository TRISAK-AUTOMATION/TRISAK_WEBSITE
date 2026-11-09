-- Migration 036 — admin-editable "How to Apply" + HR contact block shown
-- under Welfare and Benefits on every job on the Career page.
--
-- One singleton row (same pattern as contacts_page_content), edited from
-- Admin > Edit > Career (/admin/career).
--
--   apply_steps   JSON list of { "en", "th" } — the "How to Apply" items,
--                 added / removed / reordered in the admin.
--   hr_name_*     HR contact person (bilingual); phone / email / Line ID are
--                 shared by both languages. Blank fields are hidden on the
--                 public page.
--
-- Seeds default apply steps only when the table is empty, so re-running
-- never overwrites admin edits. Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak -f migrations/036_career_page_content.sql

CREATE TABLE IF NOT EXISTS career_page_content (
  id           SERIAL PRIMARY KEY,
  apply_steps  JSONB NOT NULL DEFAULT '[]'::jsonb,
  hr_name_en   VARCHAR(255),
  hr_name_th   VARCHAR(255),
  hr_phone     VARCHAR(50),
  hr_email     VARCHAR(150),
  hr_line_id   VARCHAR(100),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO career_page_content (apply_steps)
SELECT '[
  {"en": "Send your resume by email to Human Resources, stating the position you are applying for.", "th": "ส่งใบสมัครและเรซูเม่ทางอีเมลถึงฝ่ายบุคคล โดยระบุตำแหน่งที่ต้องการสมัคร"},
  {"en": "Attach copies of your education certificates and a recent photo.", "th": "แนบสำเนาวุฒิการศึกษาและรูปถ่ายปัจจุบัน"},
  {"en": "Human Resources will contact shortlisted applicants to arrange an interview.", "th": "ฝ่ายบุคคลจะติดต่อกลับผู้ที่ผ่านการคัดเลือกเพื่อนัดหมายสัมภาษณ์"}
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM career_page_content);
