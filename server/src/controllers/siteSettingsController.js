import pool from "../config/db.js";
import { logActivity } from "../utils/activityLog.js";

const FIELDS = ["header_logo_url", "footer_logo_url", "favicon_url"];

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

  // header_visible is optional so older clients that only send the logo
  // fields never flip it by accident. When present it must be a boolean.
  let headerVisible = null;
  if (body.header_visible !== undefined) {
    if (typeof body.header_visible !== "boolean") {
      return res.status(400).json({ error: "header_visible must be true or false" });
    }
    headerVisible = body.header_visible;
  }
  const values = [...FIELDS.map((f) => body[f] ?? null), headerVisible];

  try {
    const { rows: existing } = await pool.query("SELECT id FROM site_settings ORDER BY id LIMIT 1");

    if (existing.length) {
      const setClause = FIELDS.map((f, i) => `${f} = $${i + 1}`).join(", ");
      const vIdx = FIELDS.length + 1;
      const { rows } = await pool.query(
        `UPDATE site_settings
            SET ${setClause},
                header_visible = COALESCE($${vIdx}, header_visible),
                updated_at = now()
          WHERE id = $${vIdx + 1} RETURNING *`,
        [...values, existing[0].id]
      );
      logActivity("settings_updated", "อัปเดตการตั้งค่าเว็บไซต์ (โลโก้ / Favicon / การแสดง Header)");
      return res.json(rows[0]);
    }

    const columns = [...FIELDS, "header_visible"].join(", ");
    const placeholders = values.map((_, i) => (i === FIELDS.length ? `COALESCE($${i + 1}, TRUE)` : `$${i + 1}`)).join(", ");
    const { rows } = await pool.query(
      `INSERT INTO site_settings (${columns}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    logActivity("settings_updated", "อัปเดตการตั้งค่าเว็บไซต์ (โลโก้ / Favicon / การแสดง Header)");
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
}
