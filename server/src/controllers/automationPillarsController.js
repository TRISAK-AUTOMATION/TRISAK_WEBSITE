import pool from "../config/db.js";
import { logActivity } from "../utils/activityLog.js";
import { reorderRow, parseDirection } from "./adminController.js";

// The four "Automation Solutions" cards on the Home page.
//   public  GET  /api/automation-pillars                       active cards, display order
//   admin   GET  /api/admin/automation-pillars                 every card (incl. disabled)
//           POST /api/admin/automation-pillars                 create a card
//           PUT  /api/admin/automation-pillars/:id             edit a card (incl. its display order)
//           DELETE /api/admin/automation-pillars/:id           delete a card
//           PATCH /api/admin/automation-pillars/:id/status     enable / disable
//           POST /api/admin/automation-pillars/:id/reorder     move up / down
// Display order (sort_order) is always kept as a gap-free 1..N sequence: creating,
// moving and deleting a card renumber the others in the same transaction.

const MAX_FEATURES = 3;
const MAX_ORDER = 999;

// ---- sanitizing -----------------------------------------------------------
// Text is stored as plain text: HTML tags and control characters are removed.
// (The site also renders it through React, which escapes it again on output.)
const stripTags = (s) => s.replace(/<[^>]*>/g, "");
const stripControl = (s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
const oneLine = (v) => (typeof v === "string" ? stripControl(stripTags(v)).replace(/\s+/g, " ").trim() : "");
const multiLine = (v) =>
  typeof v === "string" ? stripControl(stripTags(v)).replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim() : "";

// Only same-site paths ("/automation-solution") or http(s) URLs — never
// javascript:, data:, protocol-relative ("//host") or backslash tricks.
const isSafeUrl = (u) => /^\/(?![/\\])\S*$/.test(u) || /^https?:\/\/[^\s<>"']+$/i.test(u);
const isIconKey = (v) => /^[a-z0-9][a-z0-9-]{0,39}$/.test(v);

// ---- (de)serializing --------------------------------------------------------
function normalizeFeatures(raw) {
  return (Array.isArray(raw) ? raw : []).slice(0, MAX_FEATURES).map((f) => ({
    label: f?.label || "",
    labelTh: f?.labelTh || "",
    icon: f?.icon || "",
  }));
}

function toDto(r) {
  return {
    id: r.id,
    number: r.number || "",
    title: r.title,
    titleTh: r.title_th || "",
    description: r.description || "",
    descriptionTh: r.description_th || "",
    features: normalizeFeatures(r.features),
    imageUrl: r.image_url || "",
    imageAlt: r.image_alt || "",
    imageAltTh: r.image_alt_th || "",
    imagePositionX: r.image_position_x ?? 50,
    imagePositionY: r.image_position_y ?? 50,
    linkUrl: r.link_url || "/automation-solution",
    isActive: r.is_active,
    sortOrder: r.sort_order,
    updatedAt: r.updated_at,
  };
}

// Returns { value } with cleaned fields, or { error } with a message naming the field.
function validate(body) {
  const b = body || {};
  const v = {
    number: oneLine(b.number),
    title: oneLine(b.title),
    titleTh: oneLine(b.titleTh),
    description: multiLine(b.description),
    descriptionTh: multiLine(b.descriptionTh),
    imageUrl: typeof b.imageUrl === "string" ? b.imageUrl.trim() : "",
    imageAlt: oneLine(b.imageAlt),
    imageAltTh: oneLine(b.imageAltTh),
    linkUrl: typeof b.linkUrl === "string" ? b.linkUrl.trim() : "",
  };

  if (typeof b.isActive !== "boolean") return { error: "Display status (isActive) must be true or false." };
  v.isActive = b.isActive;

  // optional: 1 = first. Omitted → a new card goes last / an edited card keeps its place.
  if (b.sortOrder == null || b.sortOrder === "") v.sortOrder = null;
  else if (!Number.isInteger(b.sortOrder) || b.sortOrder < 1 || b.sortOrder > MAX_ORDER) {
    return { error: `Display order must be a whole number from 1 to ${MAX_ORDER}.` };
  } else v.sortOrder = b.sortOrder;

  if (v.number.length > 10) return { error: "Solution number must be 10 characters or fewer." };
  if (!v.title) return { error: "Please enter the solution title (English)." };
  if (v.title.length > 100 || v.titleTh.length > 100) return { error: "Titles must be 100 characters or fewer." };
  if (!v.description) return { error: "Please enter the description (English)." };
  if (v.description.length > 400 || v.descriptionTh.length > 400) {
    return { error: "Descriptions must be 400 characters or fewer." };
  }

  if (v.imageUrl && (v.imageUrl.length > 255 || !isSafeUrl(v.imageUrl))) {
    return { error: "The image URL is not valid. Upload an image again." };
  }
  if (v.imageAlt.length > 200 || v.imageAltTh.length > 200) {
    return { error: "Image alt text must be 200 characters or fewer." };
  }

  const pos = (n) => (n == null ? 50 : n);
  v.imagePositionX = pos(b.imagePositionX);
  v.imagePositionY = pos(b.imagePositionY);
  for (const n of [v.imagePositionX, v.imagePositionY]) {
    if (!Number.isInteger(n) || n < 0 || n > 100) return { error: "Image position must be a whole number from 0 to 100." };
  }

  if (!v.linkUrl) return { error: "Please enter the link URL." };
  if (v.linkUrl.length > 255 || !isSafeUrl(v.linkUrl)) {
    return { error: "The link must be a site path such as /automation-solution, or a full http(s):// address." };
  }

  if (b.features != null && !Array.isArray(b.features)) return { error: "features must be a list." };
  const features = [];
  for (const [i, raw] of (b.features || []).slice(0, MAX_FEATURES).entries()) {
    const label = oneLine(raw?.label);
    const labelTh = oneLine(raw?.labelTh);
    const icon = typeof raw?.icon === "string" ? raw.icon.trim() : "";
    if (!label && !labelTh && !icon) continue; // an empty slot is simply "no feature"
    if (!label) return { error: `Feature ${i + 1}: please enter the feature name (English).` };
    if (label.length > 40 || labelTh.length > 40) return { error: `Feature ${i + 1}: names must be 40 characters or fewer.` };
    if (icon && !(isIconKey(icon) || (icon.length <= 255 && isSafeUrl(icon)))) {
      return { error: `Feature ${i + 1}: the icon is not valid. Pick one from the list or upload an image.` };
    }
    features.push({ label, labelTh, icon });
  }
  v.features = features;
  return { value: v };
}

// ---- ordering ------------------------------------------------------------------
// Puts card `id` at 1-based `position` (clamped to 1..N) and renumbers every card
// 1..N. Runs inside the caller's transaction; the row lock stops two admins
// reordering at the same moment from interleaving.
async function placeAt(client, id, position) {
  const { rows } = await client.query("SELECT id FROM automation_pillars ORDER BY sort_order, id FOR UPDATE");
  const ids = rows.map((r) => r.id).filter((x) => String(x) !== String(id));
  const at = Math.min(Math.max(position, 1), ids.length + 1);
  ids.splice(at - 1, 0, Number(id));
  await client.query(
    `UPDATE automation_pillars AS p SET sort_order = o.pos
     FROM unnest($1::int[]) WITH ORDINALITY AS o(id, pos)
     WHERE p.id = o.id AND p.sort_order IS DISTINCT FROM o.pos`,
    [ids]
  );
}

async function inTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// ---- public -------------------------------------------------------------------
export async function listPillarsPublic(req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM automation_pillars WHERE is_active = true ORDER BY sort_order, id"
    );
    res.json(rows.map(toDto));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load automation solutions" });
  }
}

// ---- admin ----------------------------------------------------------------------
export async function listPillarsAdmin(req, res) {
  try {
    const { rows } = await pool.query("SELECT * FROM automation_pillars ORDER BY sort_order, id");
    res.json(rows.map(toDto));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load automation solutions" });
  }
}

export async function createPillar(req, res) {
  const { value: v, error } = validate(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const created = await inTransaction(async (client) => {
      // inserted last, then moved if the admin picked another position
      const { rows } = await client.query(
        `INSERT INTO automation_pillars
           (number, title, title_th, description, description_th, features, image_url, image_alt, image_alt_th,
            image_position_x, image_position_y, link_url, is_active, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11, $12, $13,
                 (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM automation_pillars))
         RETURNING *`,
        [
          v.number || null, v.title, v.titleTh || null, v.description, v.descriptionTh || null,
          JSON.stringify(v.features), v.imageUrl || null, v.imageAlt || null, v.imageAltTh || null,
          v.imagePositionX, v.imagePositionY, v.linkUrl, v.isActive,
        ]
      );
      if (v.sortOrder != null) await placeAt(client, rows[0].id, v.sortOrder);
      const fresh = await client.query("SELECT * FROM automation_pillars WHERE id = $1", [rows[0].id]);
      return fresh.rows[0];
    });
    logActivity("pillar_created", `เพิ่มการ์ดโซลูชันอัตโนมัติ "${v.title}"`);
    res.status(201).json(toDto(created));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "The card could not be created. Please try again." });
  }
}

export async function updatePillar(req, res) {
  const { id } = req.params;
  if (!/^\d+$/.test(id)) return res.status(400).json({ error: "Invalid id" });
  const { value: v, error } = validate(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const updated = await inTransaction(async (client) => {
      const { rows } = await client.query(
        `UPDATE automation_pillars
         SET number = $1, title = $2, title_th = $3, description = $4, description_th = $5,
             features = $6::jsonb, image_url = $7, image_alt = $8, image_alt_th = $9,
             image_position_x = $10, image_position_y = $11,
             link_url = $12, is_active = $13, updated_at = now()
         WHERE id = $14 RETURNING *`,
        [
          v.number || null, v.title, v.titleTh || null, v.description, v.descriptionTh || null,
          JSON.stringify(v.features), v.imageUrl || null, v.imageAlt || null, v.imageAltTh || null,
          v.imagePositionX, v.imagePositionY, v.linkUrl, v.isActive, id,
        ]
      );
      if (!rows.length) return null;
      if (v.sortOrder != null && v.sortOrder !== rows[0].sort_order) {
        await placeAt(client, id, v.sortOrder);
        return (await client.query("SELECT * FROM automation_pillars WHERE id = $1", [id])).rows[0];
      }
      return rows[0];
    });
    if (!updated) return res.status(404).json({ error: "Solution card not found" });
    logActivity("pillar_edited", `แก้ไขการ์ดโซลูชันอัตโนมัติ "${v.title}"`);
    res.json(toDto(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "The card could not be saved. Please try again." });
  }
}

export async function deletePillar(req, res) {
  const { id } = req.params;
  if (!/^\d+$/.test(id)) return res.status(400).json({ error: "Invalid id" });
  try {
    const deleted = await inTransaction(async (client) => {
      const { rows } = await client.query("DELETE FROM automation_pillars WHERE id = $1 RETURNING title", [id]);
      if (!rows.length) return null;
      // close the gap so display order stays 1..N
      await client.query(
        `UPDATE automation_pillars AS p SET sort_order = o.pos
         FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY sort_order, id) AS pos FROM automation_pillars) AS o
         WHERE p.id = o.id AND p.sort_order <> o.pos`
      );
      return rows[0];
    });
    if (!deleted) return res.status(404).json({ error: "Solution card not found" });
    logActivity("pillar_deleted", `ลบการ์ดโซลูชันอัตโนมัติ "${deleted.title}"`);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "The card could not be deleted. Please try again." });
  }
}

export async function togglePillarStatus(req, res) {
  const { isActive } = req.body || {};
  if (typeof isActive !== "boolean") return res.status(400).json({ error: "isActive (boolean) is required" });
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: "Invalid id" });
  try {
    const { rows } = await pool.query(
      "UPDATE automation_pillars SET is_active = $1, updated_at = now() WHERE id = $2 RETURNING *",
      [isActive, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Solution card not found" });
    res.json(toDto(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update status" });
  }
}

export async function reorderPillar(req, res) {
  const direction = parseDirection(req, res);
  if (!direction) return;
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: "Invalid id" });
  try {
    const result = await reorderRow("automation_pillars", req.params.id, direction, []);
    if (result === "not-found") return res.status(404).json({ error: "Solution card not found" });
    res.json({ success: true, moved: result === "ok" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reorder" });
  }
}
