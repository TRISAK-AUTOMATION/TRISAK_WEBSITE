import pool from "../config/db.js";

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
  const values = FIELDS.map((f) => body[f] ?? null);

  try {
    const { rows: existing } = await pool.query("SELECT id FROM site_settings ORDER BY id LIMIT 1");

    if (existing.length) {
      const setClause = FIELDS.map((f, i) => `${f} = $${i + 1}`).join(", ");
      const { rows } = await pool.query(
        `UPDATE site_settings SET ${setClause}, updated_at = now() WHERE id = $${FIELDS.length + 1} RETURNING *`,
        [...values, existing[0].id]
      );
      return res.json(rows[0]);
    }

    const columns = FIELDS.join(", ");
    const placeholders = FIELDS.map((_, i) => `$${i + 1}`).join(", ");
    const { rows } = await pool.query(
      `INSERT INTO site_settings (${columns}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
}
