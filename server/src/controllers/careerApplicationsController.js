import fs from "fs";
import path from "path";
import pool from "../config/db.js";
import { logActivity } from "../utils/activityLog.js";
import { resumesDir, sanitizeResumeName } from "../middleware/uploadResume.js";

// Job applications from the Career page popup.
//   public  POST   /api/career-applications                       multipart: jobId, fullName, phone, email, message, resume
//   admin   GET    /api/admin/career-applications                 ?q= &status= &jobId= &sort= &page= &pageSize=
//           GET    /api/admin/career-applications/:id
//           PATCH  /api/admin/career-applications/:id/status      { status }
//           DELETE /api/admin/career-applications/:id             (also deletes the résumé file)
//           GET    /api/admin/career-applications/:id/resume      download the résumé

export const APPLICATION_STATUSES = ["new", "reviewing", "interview", "hired", "rejected"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+()\-.\s]{6,30}$/;
const MAX_MESSAGE = 3000;

const clean = (v) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim() : "");
const parseId = (raw) => (/^\d+$/.test(String(raw)) ? Number(raw) : null);
const escapeLike = (s) => s.replace(/[\\%_]/g, "\\$&");

const COLUMNS = `id, job_id, job_title, full_name, phone, email, message, resume_name, resume_size,
  (resume_file IS NOT NULL) AS has_resume, status, created_at, updated_at`;

const removeFile = (file) => {
  if (file) fs.unlink(path.join(resumesDir, path.basename(file)), () => {});
};

// ---- simple per-IP rate limit for the public form (in memory) ----
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map(); // ip -> [timestamps]
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  return recent.length > MAX_PER_WINDOW;
}

// ---- public ----
export async function submitApplication(req, res) {
  const fail = (status, error) => {
    removeFile(req.file?.filename);
    return res.status(status).json({ error });
  };

  if (rateLimited(req.ip)) return fail(429, "Too many applications. Please try again later.");

  const b = req.body || {};
  const fullName = clean(b.fullName).replace(/\s+/g, " ");
  const phone = clean(b.phone);
  const email = clean(b.email);
  const message = clean(b.message);
  const jobId = parseId(b.jobId);

  if (!fullName || !phone || !email) return fail(400, "Full name, phone and email are required.");
  if (fullName.length > 150) return fail(400, "Full name must be 150 characters or fewer.");
  if (!PHONE_RE.test(phone)) return fail(400, "Please enter a valid phone number.");
  if (email.length > 150 || !EMAIL_RE.test(email)) return fail(400, "Please enter a valid email address.");
  if (message.length > MAX_MESSAGE) return fail(400, `Message must be ${MAX_MESSAGE} characters or fewer.`);
  if (!req.file) return fail(400, "Please attach your resume.");
  if (jobId === null) return fail(400, "Please choose a position.");

  try {
    const job = await pool.query(
      "SELECT id, COALESCE(NULLIF(title_th, ''), title_en) AS title FROM career_jobs WHERE id = $1 AND is_active = true",
      [jobId]
    );
    if (!job.rows.length) return fail(400, "This position is no longer open.");

    const { rows } = await pool.query(
      `INSERT INTO career_applications
         (job_id, job_title, full_name, phone, email, message, resume_file, resume_name, resume_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, created_at`,
      [
        jobId, job.rows[0].title, fullName, phone, email, message || null,
        req.file.filename, sanitizeResumeName(req.file.originalname), req.file.size,
      ]
    );
    logActivity("career_application_received", `ใบสมัครงานใหม่: ${fullName} — ${job.rows[0].title}`);
    res.status(201).json({ success: true, id: rows[0].id });
  } catch (err) {
    console.error(err);
    return fail(500, "Failed to submit application");
  }
}

// ---- admin ----
export async function listApplications(req, res) {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const status = APPLICATION_STATUSES.includes(req.query.status) ? req.query.status : "";
    const jobId = parseId(req.query.jobId);
    const sortDir = req.query.sort === "asc" ? "ASC" : "DESC";
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 10, 1), 100);

    const where = [];
    const params = [];
    if (status) {
      params.push(status);
      where.push(`status = $${params.length}`);
    }
    if (jobId !== null) {
      params.push(jobId);
      where.push(`job_id = $${params.length}`);
    }
    if (q) {
      params.push(`%${escapeLike(q)}%`);
      const p = `$${params.length}`;
      where.push(`(full_name ILIKE ${p} OR email ILIKE ${p} OR phone ILIKE ${p} OR job_title ILIKE ${p})`);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [countRes, listRes, statusRes] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS n FROM career_applications ${whereSql}`, params),
      pool.query(
        `SELECT ${COLUMNS} FROM career_applications ${whereSql}
         ORDER BY created_at ${sortDir}, id ${sortDir}
         LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
        params
      ),
      pool.query("SELECT status, COUNT(*)::int AS n FROM career_applications GROUP BY status"),
    ]);

    const counts = Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, 0]));
    statusRes.rows.forEach((r) => {
      counts[r.status] = r.n;
    });
    res.json({ items: listRes.rows, total: countRes.rows[0].n, page, pageSize, counts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load applications" });
  }
}

export async function getApplication(req, res) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(404).json({ error: "ไม่พบใบสมัครนี้" });
  try {
    const { rows } = await pool.query(`SELECT ${COLUMNS} FROM career_applications WHERE id = $1`, [id]);
    if (!rows.length) return res.status(404).json({ error: "ไม่พบใบสมัครนี้" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load application" });
  }
}

export async function updateApplicationStatus(req, res) {
  const { status } = req.body || {};
  if (!APPLICATION_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${APPLICATION_STATUSES.join(", ")}` });
  }
  const id = parseId(req.params.id);
  if (id === null) return res.status(404).json({ error: "ไม่พบใบสมัครนี้" });
  try {
    const { rows } = await pool.query(
      `UPDATE career_applications SET status = $1, updated_at = now() WHERE id = $2 RETURNING ${COLUMNS}`,
      [status, id]
    );
    if (!rows.length) return res.status(404).json({ error: "ไม่พบใบสมัครนี้" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update application" });
  }
}

export async function deleteApplication(req, res) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(404).json({ error: "ไม่พบใบสมัครนี้" });
  try {
    const { rows } = await pool.query(
      "DELETE FROM career_applications WHERE id = $1 RETURNING resume_file, full_name",
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: "ไม่พบใบสมัครนี้" });
    removeFile(rows[0].resume_file);
    logActivity("career_application_deleted", `ลบใบสมัครงานของ ${rows[0].full_name}`);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete application" });
  }
}

export async function downloadResume(req, res) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(404).json({ error: "ไม่พบไฟล์" });
  try {
    const { rows } = await pool.query(
      "SELECT resume_file, resume_name FROM career_applications WHERE id = $1",
      [id]
    );
    const file = rows[0]?.resume_file;
    if (!file) return res.status(404).json({ error: "ไม่พบไฟล์ Resume" });
    const full = path.join(resumesDir, path.basename(file));
    if (!fs.existsSync(full)) return res.status(404).json({ error: "ไม่พบไฟล์ Resume บนเซิร์ฟเวอร์" });
    res.set("X-Content-Type-Options", "nosniff");
    res.download(full, rows[0].resume_name || path.basename(file));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to download resume" });
  }
}
