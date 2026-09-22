import pool from "../config/db.js";
import { CONTACT_STATUSES, INTEREST_LABELS, interestLabel } from "../utils/contactRequests.js";

const COLUMNS = `id, name, company, email, phone, interested_in, message, status, created_at, updated_at`;

const withLabel = (r) => ({ ...r, interestLabel: interestLabel(r.interested_in) });

// Escape LIKE wildcards so a search for "50%" or "a_b" is taken literally.
const escapeLike = (s) => s.replace(/[\\%_]/g, "\\$&");

// Route ids come in as strings; anything non-numeric is simply "not found".
const parseId = (raw) => (/^\d+$/.test(String(raw)) ? Number(raw) : null);

// GET /api/admin/contact-requests
//   ?q=        search Name / Company / Email / Interested In
//   ?status=   new | in_progress | completed
//   ?sort=     desc (newest first, default) | asc
//   ?page=, ?pageSize=
export async function listContactRequests(req, res) {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const status = CONTACT_STATUSES.includes(req.query.status) ? req.query.status : "";
    const sortDir = req.query.sort === "asc" ? "ASC" : "DESC";
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 10, 1), 100);

    const where = [];
    const params = [];

    if (status) {
      params.push(status);
      where.push(`status = $${params.length}`);
    }

    if (q) {
      const like = `%${escapeLike(q)}%`;
      params.push(like);
      const p = `$${params.length}`;
      const clauses = [
        `name ILIKE ${p}`,
        `company ILIKE ${p}`,
        `email ILIKE ${p}`,
        `interested_in ILIKE ${p}`,
      ];
      // "Interested In" is stored as a key (e.g. automation_solution) but
      // shown to admins as a label, so also match on the label they see.
      const ql = q.toLowerCase();
      const keys = Object.entries(INTEREST_LABELS)
        .filter(([, label]) => label.toLowerCase().includes(ql))
        .map(([key]) => key);
      if (keys.length) {
        params.push(keys);
        clauses.push(`interested_in = ANY($${params.length})`);
      }
      where.push(`(${clauses.join(" OR ")})`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [countRes, listRes, statusRes] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS n FROM contact_requests ${whereSql}`, params),
      pool.query(
        `SELECT ${COLUMNS} FROM contact_requests ${whereSql}
         ORDER BY created_at ${sortDir}, id ${sortDir}
         LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
        params
      ),
      pool.query(`SELECT status, COUNT(*)::int AS n FROM contact_requests GROUP BY status`),
    ]);

    const counts = { new: 0, in_progress: 0, completed: 0 };
    statusRes.rows.forEach((r) => {
      counts[r.status] = r.n;
    });

    res.json({
      items: listRes.rows.map(withLabel),
      total: countRes.rows[0].n,
      page,
      pageSize,
      counts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load contact requests" });
  }
}

// GET /api/admin/contact-requests/:id
export async function getContactRequest(req, res) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(404).json({ error: "Contact request not found" });
  try {
    const { rows } = await pool.query(`SELECT ${COLUMNS} FROM contact_requests WHERE id = $1`, [id]);
    if (!rows.length) return res.status(404).json({ error: "Contact request not found" });
    res.json(withLabel(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load contact request" });
  }
}

// PATCH /api/admin/contact-requests/:id/status   { status }
export async function updateContactRequestStatus(req, res) {
  const { status } = req.body || {};
  if (!CONTACT_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${CONTACT_STATUSES.join(", ")}` });
  }
  const id = parseId(req.params.id);
  if (id === null) return res.status(404).json({ error: "Contact request not found" });
  try {
    const { rows } = await pool.query(
      `UPDATE contact_requests SET status = $1, updated_at = now()
       WHERE id = $2 RETURNING ${COLUMNS}`,
      [status, id]
    );
    if (!rows.length) return res.status(404).json({ error: "Contact request not found" });
    res.json(withLabel(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update contact request" });
  }
}

// DELETE /api/admin/contact-requests/:id
export async function deleteContactRequest(req, res) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(404).json({ error: "Contact request not found" });
  try {
    const result = await pool.query("DELETE FROM contact_requests WHERE id = $1", [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Contact request not found" });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete contact request" });
  }
}
