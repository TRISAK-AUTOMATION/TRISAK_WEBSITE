import pool from "../config/db.js";
import { logActivity } from "../utils/activityLog.js";
import { reorderRow, parseDirection } from "./adminController.js";

/**
 * History page — Timeline, Statistics and Organization Structure.
 *
 * All three sections share the same admin behaviour (list / get / create /
 * update / enable-disable / reorder / delete), so the handlers are built by
 * one factory from a small per-section description. Section-specific rules
 * (the org chart's parent/child checks) plug in through `beforeSave` and
 * `beforeDelete` hooks.
 *
 * Request bodies are camelCase (same as the Industries endpoints); columns
 * are snake_case. Editing never touches `sort_order` — it only changes via
 * the dedicated reorder endpoint (or "added at the end" on create), so a
 * plain edit can't silently shuffle the public page.
 */

const MAX_URL = 255;

// ---- helpers ----

function str(v) {
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Reads + validates the body against a field list:
 *   { key, col, label, max, required }
 * Returns { values: {col: value}, error }.
 */
function readFields(fields, body) {
  const values = {};
  for (const f of fields) {
    const raw = body?.[f.key];
    if (raw != null && typeof raw !== "string") {
      return { error: `${f.label} must be text.` };
    }
    const v = str(raw);
    if (f.required && !v) return { error: `Please enter ${f.label}.` };
    if (v.length > f.max) return { error: `${f.label} must be ${f.max} characters or fewer.` };
    values[f.col] = v || null;
  }
  return { values };
}

function readIsActive(body) {
  if (body?.isActive === undefined) return { value: true };
  if (typeof body.isActive !== "boolean") return { error: "isActive must be true or false." };
  return { value: body.isActive };
}

function validId(id) {
  return /^\d+$/.test(String(id)) && Number(id) <= 2147483647;
}

// ---- generic factory ----

function makeHandlers({ table, noun, logLabel, nameCol, fields, scopeColumns = [], beforeSave, beforeDelete }) {
  const nameFor = (row) => row[nameCol] || `#${row.id}`;

  async function list(req, res) {
    try {
      const { rows } = await pool.query(`SELECT * FROM ${table} ORDER BY sort_order, id`);
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: `Failed to load ${noun}s` });
    }
  }

  async function get(req, res) {
    if (!validId(req.params.id)) return res.status(404).json({ error: `${noun} not found` });
    try {
      const { rows } = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [req.params.id]);
      if (!rows.length) return res.status(404).json({ error: `${noun} not found` });
      res.json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: `Failed to load ${noun}` });
    }
  }

  // Builds the validated column map shared by create and update.
  async function prepare(req, existing) {
    const { values, error } = readFields(fields, req.body);
    if (error) return { error };
    const active = readIsActive(req.body);
    if (active.error) return { error: active.error };
    values.is_active = active.value;
    if (beforeSave) {
      const problem = await beforeSave(values, req.body, existing);
      if (problem) return { error: problem.error, status: problem.status };
    }
    return { values };
  }

  // sort_order for a row being placed at the end of its sibling group.
  async function nextSortOrder(values) {
    const conds = scopeColumns.map((c, i) => `${c} IS NOT DISTINCT FROM $${i + 1}`);
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
    const { rows } = await pool.query(
      `SELECT COALESCE(MAX(sort_order), 0) + 1 AS n FROM ${table} ${where}`,
      scopeColumns.map((c) => values[c] ?? null)
    );
    return rows[0].n;
  }

  async function create(req, res) {
    try {
      const { values, error, status } = await prepare(req, null);
      if (error) return res.status(status || 400).json({ error });
      values.sort_order = await nextSortOrder(values);
      const cols = Object.keys(values);
      const { rows } = await pool.query(
        `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(", ")}) RETURNING *`,
        cols.map((c) => values[c])
      );
      logActivity("about_updated", `เพิ่ม${logLabel} "${nameFor(rows[0])}" (หน้าประวัติบริษัท)`);
      res.status(201).json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: `The ${noun} could not be saved.` });
    }
  }

  async function update(req, res) {
    if (!validId(req.params.id)) return res.status(404).json({ error: `${noun} not found` });
    try {
      const existing = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [req.params.id]);
      if (!existing.rows.length) return res.status(404).json({ error: `${noun} not found` });
      const { values, error, status } = await prepare(req, existing.rows[0]);
      if (error) return res.status(status || 400).json({ error });

      // Moving to a different sibling group => land at the end of the new one.
      const scopeChanged = scopeColumns.some((c) => (values[c] ?? null) !== (existing.rows[0][c] ?? null));
      if (scopeChanged) values.sort_order = await nextSortOrder(values);

      const cols = Object.keys(values);
      const { rows } = await pool.query(
        `UPDATE ${table} SET ${cols.map((c, i) => `${c} = $${i + 1}`).join(", ")}, updated_at = now()
         WHERE id = $${cols.length + 1} RETURNING *`,
        [...cols.map((c) => values[c]), req.params.id]
      );
      logActivity("about_updated", `แก้ไข${logLabel} "${nameFor(rows[0])}" (หน้าประวัติบริษัท)`);
      res.json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: `The ${noun} could not be saved.` });
    }
  }

  async function toggleStatus(req, res) {
    if (!validId(req.params.id)) return res.status(404).json({ error: `${noun} not found` });
    const { isActive } = req.body || {};
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ error: "isActive (boolean) is required" });
    }
    try {
      const { rows } = await pool.query(
        `UPDATE ${table} SET is_active = $1, updated_at = now() WHERE id = $2 RETURNING *`,
        [isActive, req.params.id]
      );
      if (!rows.length) return res.status(404).json({ error: `${noun} not found` });
      logActivity(
        "about_updated",
        `${isActive ? "เปิด" : "ปิด"}การแสดง${logLabel} "${nameFor(rows[0])}" (หน้าประวัติบริษัท)`
      );
      res.json({ id: rows[0].id, is_active: rows[0].is_active });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: `Failed to update ${noun} status` });
    }
  }

  async function reorder(req, res) {
    const direction = parseDirection(req, res);
    if (!direction) return;
    if (!validId(req.params.id)) return res.status(404).json({ error: `${noun} not found` });
    try {
      const result = await reorderRow(table, req.params.id, direction, scopeColumns);
      if (result === "not-found") return res.status(404).json({ error: `${noun} not found` });
      res.json({ success: true, moved: result === "ok" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to reorder" });
    }
  }

  async function remove(req, res) {
    if (!validId(req.params.id)) return res.status(404).json({ error: `${noun} not found` });
    try {
      const existing = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [req.params.id]);
      if (!existing.rows.length) return res.status(404).json({ error: `${noun} not found` });
      if (beforeDelete) {
        const problem = await beforeDelete(existing.rows[0]);
        if (problem) return res.status(problem.status || 400).json({ error: problem.error });
      }
      await pool.query(`DELETE FROM ${table} WHERE id = $1`, [req.params.id]);
      logActivity("about_updated", `ลบ${logLabel} "${nameFor(existing.rows[0])}" (หน้าประวัติบริษัท)`);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: `Failed to delete ${noun}` });
    }
  }

  return { list, get, create, update, toggleStatus, reorder, remove };
}

// ---- Timeline ----

export const timelineAdmin = makeHandlers({
  table: "history_timeline",
  noun: "timeline entry",
  logLabel: "ไทม์ไลน์",
  nameCol: "title_en",
  fields: [
    { key: "yearEn", col: "year_en", label: "the year/date (English)", max: 100, required: true },
    { key: "yearTh", col: "year_th", label: "the year/date (Thai)", max: 100 },
    { key: "titleEn", col: "title_en", label: "the event title (English)", max: 255, required: true },
    { key: "titleTh", col: "title_th", label: "the event title (Thai)", max: 255 },
    { key: "descriptionEn", col: "description_en", label: "the description (English)", max: 5000 },
    { key: "descriptionTh", col: "description_th", label: "the description (Thai)", max: 5000 },
    { key: "imageUrl", col: "image_url", label: "the image URL", max: MAX_URL },
  ],
});

// ---- Statistics ----

export const statsAdmin = makeHandlers({
  table: "history_stats",
  noun: "statistic",
  logLabel: "สถิติ",
  nameCol: "label_en",
  fields: [
    { key: "labelEn", col: "label_en", label: "the label (English)", max: 150, required: true },
    { key: "labelTh", col: "label_th", label: "the label (Thai)", max: 150 },
    { key: "value", col: "value", label: "the value", max: 50, required: true },
    { key: "unitEn", col: "unit_en", label: "the unit/suffix (English)", max: 30 },
    { key: "unitTh", col: "unit_th", label: "the unit/suffix (Thai)", max: 30 },
  ],
});

// ---- Organization structure ----

// Is `candidateId` the node itself or one of its descendants? Walks UP from
// the proposed parent; reaching `nodeId` means the move would create a loop.
async function wouldCreateCycle(nodeId, proposedParentId) {
  const { rows } = await pool.query(
    `WITH RECURSIVE ancestors AS (
       SELECT id, parent_id FROM history_org_nodes WHERE id = $1
       UNION
       SELECT n.id, n.parent_id FROM history_org_nodes n JOIN ancestors a ON n.id = a.parent_id
     )
     SELECT 1 FROM ancestors WHERE id = $2 LIMIT 1`,
    [proposedParentId, nodeId]
  );
  return rows.length > 0;
}

export const orgAdmin = makeHandlers({
  table: "history_org_nodes",
  noun: "organization node",
  logLabel: "โครงสร้างองค์กร",
  nameCol: "name_en",
  scopeColumns: ["parent_id"],
  fields: [
    { key: "nameEn", col: "name_en", label: "the position/department name (English)", max: 150, required: true },
    { key: "nameTh", col: "name_th", label: "the position/department name (Thai)", max: 150 },
    { key: "personEn", col: "person_en", label: "the person's name (English)", max: 150 },
    { key: "personTh", col: "person_th", label: "the person's name (Thai)", max: 150 },
    { key: "imageUrl", col: "image_url", label: "the image URL", max: MAX_URL },
  ],
  async beforeSave(values, body, existing) {
    const raw = body?.parentId;
    if (raw === undefined || raw === null || raw === "") {
      values.parent_id = null;
      return null;
    }
    if (!validId(raw)) return { error: "The parent node is not valid." };
    const parentId = Number(raw);
    const parent = await pool.query("SELECT id FROM history_org_nodes WHERE id = $1", [parentId]);
    if (!parent.rows.length) return { error: "The selected parent node no longer exists." };
    if (existing && (await wouldCreateCycle(existing.id, parentId))) {
      return { error: "A node can't report to itself or to one of its own sub-nodes." };
    }
    values.parent_id = parentId;
    return null;
  },
  async beforeDelete(row) {
    const { rows } = await pool.query(
      "SELECT COUNT(*)::int AS n FROM history_org_nodes WHERE parent_id = $1",
      [row.id]
    );
    if (rows[0].n > 0) {
      return {
        status: 409,
        error: `This node has ${rows[0].n} sub-node${rows[0].n > 1 ? "s" : ""} reporting to it. Move or delete them first.`,
      };
    }
    return null;
  },
});

// ---- Public: enabled content only, trimmed to what the page renders ----

export async function getHistoryContent(req, res) {
  try {
    const [timeline, stats, org] = await Promise.all([
      pool.query(
        `SELECT id, year_en, year_th, title_en, title_th, description_en, description_th, image_url
         FROM history_timeline WHERE is_active ORDER BY sort_order, id`
      ),
      pool.query(
        `SELECT id, label_en, label_th, value, unit_en, unit_th
         FROM history_stats WHERE is_active ORDER BY sort_order, id`
      ),
      pool.query(
        `SELECT id, parent_id, name_en, name_th, person_en, person_th, image_url
         FROM history_org_nodes WHERE is_active ORDER BY sort_order, id`
      ),
    ]);

    // Nest the flat list. A node is only reachable through enabled
    // ancestors, so disabling a node also hides everything under it
    // (those nodes simply never attach to the tree).
    const byId = new Map(
      org.rows.map(({ parent_id, ...node }) => [node.id, { ...node, parentId: parent_id, children: [] }])
    );
    const roots = [];
    for (const node of byId.values()) {
      if (node.parentId == null) roots.push(node);
      else byId.get(node.parentId)?.children.push(node);
    }
    const strip = ({ parentId, children, ...rest }) => ({ ...rest, children: children.map(strip) });

    res.json({ timeline: timeline.rows, stats: stats.rows, org: roots.map(strip) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load history content" });
  }
}
