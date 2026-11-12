import pool from "../config/db.js";
import { logActivity } from "../utils/activityLog.js";

const FIELDS = ["header_logo_url", "footer_logo_url", "favicon_url"];
// Optional booleans: older clients that omit them never flip them by accident.
// Value is the default used when the settings row is first created.
const BOOL_FIELDS = { header_visible: true, glass_buttons: false };
const BOOL_NAMES = Object.keys(BOOL_FIELDS);
const LOG_MESSAGE = "อัปเดตการตั้งค่าเว็บไซต์ (โลโก้ / Favicon / การแสดง Header / สไตล์ปุ่ม)";

export async function getSiteSettings(req, res) {
  try {
    const { rows } = await pool.query("SELECT * FROM site_settings ORDER BY id LIMIT 1");
    res.json(rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load site settings" });
  }
}

export async function updateSiteSettings(req, res) {
  const body = req.body || {};

  const bools = [];
  for (const name of BOOL_NAMES) {
    const v = body[name];
    if (v !== undefined && typeof v !== "boolean") {
      return res.status(400).json({ error: `${name} must be true or false` });
    }
    bools.push(v ?? null);
  }
  const values = [...FIELDS.map((f) => body[f] ?? null), ...bools];

  try {
    const { rows: existing } = await pool.query("SELECT id FROM site_settings ORDER BY id LIMIT 1");

    if (existing.length) {
      const sets = [
        ...FIELDS.map((f, i) => `${f} = $${i + 1}`),
        ...BOOL_NAMES.map((b, i) => `${b} = COALESCE($${FIELDS.length + i + 1}, ${b})`),
      ].join(", ");
      const { rows } = await pool.query(
        `UPDATE site_settings SET ${sets}, updated_at = now()
          WHERE id = $${values.length + 1} RETURNING *`,
        [...values, existing[0].id]
      );
      logActivity("settings_updated", LOG_MESSAGE);
      return res.json(rows[0]);
    }

    const columns = [...FIELDS, ...BOOL_NAMES].join(", ");
    const placeholders = values
      .map((_, i) => (i < FIELDS.length ? `$${i + 1}` : `COALESCE($${i + 1}, ${BOOL_FIELDS[BOOL_NAMES[i - FIELDS.length]]})`))
      .join(", ");
    const { rows } = await pool.query(
      `INSERT INTO site_settings (${columns}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    logActivity("settings_updated", LOG_MESSAGE);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
}
