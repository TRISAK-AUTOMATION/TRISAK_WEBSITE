import pool from "../config/db.js";
import { logActivity } from "../utils/activityLog.js";

// ---------------- public ----------------

/**
 * Returns { image_url } if the welcome pop-up should currently show
 * on the public site (enabled AND an image has been uploaded), or
 * null otherwise. Image-only by design — no title/message/link.
 */
export async function getActivePopup(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT image_url FROM popup_settings
       WHERE is_active = true AND image_url IS NOT NULL
       ORDER BY id LIMIT 1`
    );
    res.json(rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load pop-up" });
  }
}

// ---------------- admin ----------------

export async function getPopupSettingsAdmin(req, res) {
  try {
    const { rows } = await pool.query("SELECT * FROM popup_settings ORDER BY id LIMIT 1");
    res.json(rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load popup settings" });
  }
}

export async function updatePopupSettings(req, res) {
  const { imageUrl = null, isActive = false } = req.body || {};
  try {
    const { rows: existing } = await pool.query("SELECT id FROM popup_settings ORDER BY id LIMIT 1");

    let row;
    if (existing.length) {
      const { rows } = await pool.query(
        `UPDATE popup_settings SET image_url = $1, is_active = $2, updated_at = now()
         WHERE id = $3 RETURNING *`,
        [imageUrl, isActive, existing[0].id]
      );
      row = rows[0];
    } else {
      const { rows } = await pool.query(
        `INSERT INTO popup_settings (image_url, is_active) VALUES ($1, $2) RETURNING *`,
        [imageUrl, isActive]
      );
      row = rows[0];
    }
    logActivity("popup_updated", `อัปเดตป๊อปอัพหน้าแรก (${isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"})`);
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
}
