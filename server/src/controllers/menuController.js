import pool from "../config/db.js";

function isValidLocation(location) {
  return location === "header" || location === "footer";
}

// ---- public ----

/** Returns only active items, grouped by location, for rendering the site's Header/Footer. */
export async function getMenu(req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT id, location, label_en, label_th, url FROM menu_items WHERE is_active = true ORDER BY location, sort_order"
    );
    res.json({
      header: rows.filter((r) => r.location === "header"),
      footer: rows.filter((r) => r.location === "footer"),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load menu" });
  }
}

// ---- admin ----

export async function listMenuItemsAdmin(req, res) {
  const { location } = req.query;
  if (location && !isValidLocation(location)) {
    return res.status(400).json({ error: "location must be 'header' or 'footer'" });
  }
  try {
    const { rows } = await pool.query(
      location
        ? "SELECT * FROM menu_items WHERE location = $1 ORDER BY sort_order"
        : "SELECT * FROM menu_items ORDER BY location, sort_order",
      location ? [location] : []
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load menu items" });
  }
}

export async function getMenuItemAdmin(req, res) {
  try {
    const { rows } = await pool.query("SELECT * FROM menu_items WHERE id = $1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Menu item not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load menu item" });
  }
}

export async function createMenuItem(req, res) {
  const { location, labelEn, labelTh, url, isActive = true, sortOrder = 0 } = req.body || {};
  if (!isValidLocation(location)) {
    return res.status(400).json({ error: "location must be 'header' or 'footer'" });
  }
  if (!labelEn || !labelTh || !url) {
    return res.status(400).json({ error: "labelEn, labelTh, and url are required" });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO menu_items (location, label_en, label_th, url, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [location, labelEn, labelTh, url, isActive, sortOrder]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
}

export async function updateMenuItem(req, res) {
  const { labelEn, labelTh, url, isActive, sortOrder } = req.body || {};
  if (!labelEn || !labelTh || !url) {
    return res.status(400).json({ error: "labelEn, labelTh, and url are required" });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE menu_items
       SET label_en = $1, label_th = $2, url = $3, is_active = $4, sort_order = $5, updated_at = now()
       WHERE id = $6 RETURNING *`,
      [labelEn, labelTh, url, isActive ?? true, sortOrder ?? 0, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Menu item not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
}

export async function toggleMenuItemStatus(req, res) {
  const { isActive } = req.body || {};
  if (typeof isActive !== "boolean") {
    return res.status(400).json({ error: "isActive (boolean) is required" });
  }
  try {
    const { rows } = await pool.query(
      "UPDATE menu_items SET is_active = $1, updated_at = now() WHERE id = $2 RETURNING id, is_active",
      [isActive, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Menu item not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update menu item status" });
  }
}

export async function deleteMenuItem(req, res) {
  try {
    const result = await pool.query("DELETE FROM menu_items WHERE id = $1", [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Menu item not found" });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete menu item" });
  }
}

/** Bulk reorder — persists a full drag-and-drop drop result in one call.
 *  Body: { location: "header"|"footer", orderedIds: [id, id, ...] }
 *  Each id's sort_order becomes its index in the array. Only rows that
 *  belong to `location` are touched, as a safety check against a stale
 *  or mismatched id list from the client. */
export async function reorderMenuItems(req, res) {
  const { location, orderedIds } = req.body || {};
  if (!isValidLocation(location)) {
    return res.status(400).json({ error: "location must be 'header' or 'footer'" });
  }
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return res.status(400).json({ error: "orderedIds must be a non-empty array" });
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (let i = 0; i < orderedIds.length; i++) {
      await client.query(
        "UPDATE menu_items SET sort_order = $1, updated_at = now() WHERE id = $2 AND location = $3",
        [i, orderedIds[i], location]
      );
    }
    await client.query("COMMIT");
    const { rows } = await pool.query(
      "SELECT * FROM menu_items WHERE location = $1 ORDER BY sort_order",
      [location]
    );
    res.json(rows);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to reorder menu items" });
  } finally {
    client.release();
  }
}
