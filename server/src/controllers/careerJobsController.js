import pool from "../config/db.js";
import { logActivity } from "../utils/activityLog.js";
import { reorderRow, parseDirection } from "./adminController.js";

// Open positions on the Career page.
//   public  GET    /api/career-jobs                       active jobs, display order
//   admin   GET    /api/admin/career-jobs                 every job (incl. hidden)
//           POST   /api/admin/career-jobs                 create a job (added last)
//           PUT    /api/admin/career-jobs/:id             edit a job
//           DELETE /api/admin/career-jobs/:id             delete a job
//           POST   /api/admin/career-jobs/:id/reorder     move up / down
//
// Every text field is bilingual ({ en, th }); the public page falls back to the
// other language when one is blank. Lists (responsibilities / requirements /
// benefits) are JSON arrays of { en, th }.

const MAX_LIST_ITEMS = 30;

// Stored as plain text: HTML tags and control characters are removed.
const stripTags = (s) => s.replace(/<[^>]*>/g, "");
const stripControl = (s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
const oneLine = (v) => (typeof v === "string" ? stripControl(stripTags(v)).replace(/\s+/g, " ").trim() : "");
const multiLine = (v) =>
  typeof v === "string" ? stripControl(stripTags(v)).replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim() : "";

const pair = (r, base) => ({ en: r[`${base}_en`] || "", th: r[`${base}_th`] || "" });
const list = (raw) =>
  (Array.isArray(raw) ? raw : []).map((i) => ({ en: i?.en || "", th: i?.th || "" }));

function toDto(r) {
  return {
    id: r.id,
    title: pair(r, "title"),
    location: pair(r, "location"),
    salary: pair(r, "salary"),
    type: pair(r, "job_type"),
    summary: pair(r, "summary"),
    responsibilities: list(r.responsibilities),
    requirements: list(r.requirements),
    benefits: list(r.benefits),
    isActive: r.is_active,
    sortOrder: r.sort_order,
    updatedAt: r.updated_at,
  };
}

// Returns { value } with cleaned fields, or { error } with a Thai message.
function validate(body) {
  const b = body || {};
  const text = (field, max, clean = oneLine) => {
    const en = clean(b[field]?.en);
    const th = clean(b[field]?.th);
    return { en, th, tooLong: en.length > max || th.length > max };
  };
  const v = {
    title: text("title", 200),
    location: text("location", 200),
    salary: text("salary", 100),
    type: text("type", 100),
    summary: text("summary", 1000, multiLine),
  };
  if (!v.title.en && !v.title.th) return { error: "กรุณากรอกชื่อตำแหน่งงาน" };
  for (const [k, label] of [
    ["title", "ชื่อตำแหน่ง"],
    ["location", "สถานที่"],
    ["salary", "เงินเดือน"],
    ["type", "ประเภทงาน"],
    ["summary", "รายละเอียดย่อ"],
  ]) {
    if (v[k].tooLong) return { error: `${label} ยาวเกินไป` };
  }

  for (const k of ["responsibilities", "requirements", "benefits"]) {
    if (b[k] != null && !Array.isArray(b[k])) return { error: `${k} must be a list.` };
    v[k] = (b[k] || [])
      .map((i) => ({ en: oneLine(i?.en).slice(0, 500), th: oneLine(i?.th).slice(0, 500) }))
      .filter((i) => i.en || i.th) // a row blank in both languages is dropped
      .slice(0, MAX_LIST_ITEMS);
  }

  if (typeof b.isActive !== "boolean") return { error: "isActive must be true or false." };
  v.isActive = b.isActive;
  return { value: v };
}

const values = (v) => [
  v.title.en || null, v.title.th || null,
  v.location.en || null, v.location.th || null,
  v.salary.en || null, v.salary.th || null,
  v.type.en || null, v.type.th || null,
  v.summary.en || null, v.summary.th || null,
  JSON.stringify(v.responsibilities), JSON.stringify(v.requirements), JSON.stringify(v.benefits),
  v.isActive,
];

const jobName = (v) => v.title.th || v.title.en;

// ---- public ----
export async function listCareerJobsPublic(req, res) {
  try {
    const { rows } = await pool.query("SELECT * FROM career_jobs WHERE is_active = true ORDER BY sort_order, id");
    res.json(rows.map(toDto));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load job positions" });
  }
}

// ---- admin ----
export async function listCareerJobsAdmin(req, res) {
  try {
    const { rows } = await pool.query("SELECT * FROM career_jobs ORDER BY sort_order, id");
    res.json(rows.map(toDto));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load job positions" });
  }
}

export async function createCareerJob(req, res) {
  const { value: v, error } = validate(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const { rows } = await pool.query(
      `INSERT INTO career_jobs
         (title_en, title_th, location_en, location_th, salary_en, salary_th, job_type_en, job_type_th,
          summary_en, summary_th, responsibilities, requirements, benefits, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13::jsonb, $14,
               (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM career_jobs))
       RETURNING *`,
      values(v)
    );
    logActivity("career_job_created", `เพิ่มตำแหน่งงาน "${jobName(v)}"`);
    res.status(201).json(toDto(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ไม่สามารถเพิ่มตำแหน่งงานได้ กรุณาลองใหม่" });
  }
}

export async function updateCareerJob(req, res) {
  const { id } = req.params;
  if (!/^\d+$/.test(id)) return res.status(400).json({ error: "Invalid id" });
  const { value: v, error } = validate(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const { rows } = await pool.query(
      `UPDATE career_jobs
       SET title_en = $1, title_th = $2, location_en = $3, location_th = $4, salary_en = $5, salary_th = $6,
           job_type_en = $7, job_type_th = $8, summary_en = $9, summary_th = $10,
           responsibilities = $11::jsonb, requirements = $12::jsonb, benefits = $13::jsonb,
           is_active = $14, updated_at = now()
       WHERE id = $15 RETURNING *`,
      [...values(v), id]
    );
    if (!rows.length) return res.status(404).json({ error: "ไม่พบตำแหน่งงานนี้" });
    logActivity("career_job_edited", `แก้ไขตำแหน่งงาน "${jobName(v)}"`);
    res.json(toDto(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ไม่สามารถบันทึกตำแหน่งงานได้ กรุณาลองใหม่" });
  }
}

export async function deleteCareerJob(req, res) {
  const { id } = req.params;
  if (!/^\d+$/.test(id)) return res.status(400).json({ error: "Invalid id" });
  try {
    const { rows } = await pool.query("DELETE FROM career_jobs WHERE id = $1 RETURNING title_en, title_th", [id]);
    if (!rows.length) return res.status(404).json({ error: "ไม่พบตำแหน่งงานนี้" });
    logActivity("career_job_deleted", `ลบตำแหน่งงาน "${rows[0].title_th || rows[0].title_en}"`);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ไม่สามารถลบตำแหน่งงานได้ กรุณาลองใหม่" });
  }
}

export async function reorderCareerJob(req, res) {
  const direction = parseDirection(req, res);
  if (!direction) return;
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: "Invalid id" });
  try {
    const result = await reorderRow("career_jobs", req.params.id, direction, []);
    if (result === "not-found") return res.status(404).json({ error: "ไม่พบตำแหน่งงานนี้" });
    res.json({ success: true, moved: result === "ok" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reorder" });
  }
}
