import pool from "../config/db.js";
import { logActivity } from "../utils/activityLog.js";

const FIELDS = [
  "hero_meta_en", "hero_meta_th",
  "hero_title_line1_en", "hero_title_line1_th",
  "hero_title_line2_en", "hero_title_line2_th",
  "hero_sub_en", "hero_sub_th",
  "hero_bg_image",
  "strength_eyebrow_en", "strength_eyebrow_th",
  "strength_title_en", "strength_title_th",
  "strength1_title_en", "strength1_title_th", "strength1_body_en", "strength1_body_th",
  "strength2_title_en", "strength2_title_th", "strength2_body_en", "strength2_body_th",
  "strength3_title_en", "strength3_title_th", "strength3_body_en", "strength3_body_th",
  "cta_title_line1_en", "cta_title_line1_th",
  "cta_title_line2_en", "cta_title_line2_th",
];

export async function getHomeContent(req, res) {
  try {
    const { rows } = await pool.query("SELECT * FROM home_content ORDER BY id LIMIT 1");
    res.json(rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load home content" });
  }
}

export async function updateHomeContent(req, res) {
  const body = req.body || {};
  const values = FIELDS.map((f) => body[f] ?? null);

  try {
    const { rows: existing } = await pool.query("SELECT id FROM home_content ORDER BY id LIMIT 1");

    if (existing.length) {
      const setClause = FIELDS.map((f, i) => `${f} = $${i + 1}`).join(", ");
      const { rows } = await pool.query(
        `UPDATE home_content SET ${setClause}, updated_at = now() WHERE id = $${FIELDS.length + 1} RETURNING *`,
        [...values, existing[0].id]
      );
      logActivity("banner_updated", "อัปเดตแบนเนอร์ / เนื้อหาหน้าแรก");
      return res.json(rows[0]);
    }

    const columns = FIELDS.join(", ");
    const placeholders = FIELDS.map((_, i) => `$${i + 1}`).join(", ");
    const { rows } = await pool.query(
      `INSERT INTO home_content (${columns}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    logActivity("banner_updated", "อัปเดตแบนเนอร์ / เนื้อหาหน้าแรก");
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
}
