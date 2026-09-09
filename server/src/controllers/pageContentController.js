import pool from "../config/db.js";
import { logActivity } from "../utils/activityLog.js";

// Shared helpers — every page-content table follows the same shape
// as home_content: one row, plain columns, upsert on save.

async function getSingleton(table) {
  const { rows } = await pool.query(`SELECT * FROM ${table} ORDER BY id LIMIT 1`);
  return rows[0] || null;
}

async function upsertSingleton(table, fields, body) {
  const values = fields.map((f) => body[f] ?? null);
  const { rows: existing } = await pool.query(`SELECT id FROM ${table} ORDER BY id LIMIT 1`);

  if (existing.length) {
    const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");
    const { rows } = await pool.query(
      `UPDATE ${table} SET ${setClause}, updated_at = now() WHERE id = $${fields.length + 1} RETURNING *`,
      [...values, existing[0].id]
    );
    return rows[0];
  }

  const columns = fields.join(", ");
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(", ");
  const { rows } = await pool.query(
    `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`,
    values
  );
  return rows[0];
}

// ---------------- About Us ----------------

const ABOUT_FIELDS = [
  "hero_meta_en", "hero_meta_th",
  "hero_title_en", "hero_title_th",
  "hero_sub_en", "hero_sub_th",
  "intro_eyebrow_en", "intro_eyebrow_th",
  "intro_title_en", "intro_title_th",
  "intro_lede_en", "intro_lede_th",
  "intro_body_en", "intro_body_th",
];

export async function getAboutContent(req, res) {
  try {
    res.json(await getSingleton("about_content"));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load about content" });
  }
}

export async function updateAboutContent(req, res) {
  try {
    const row = await upsertSingleton("about_content", ABOUT_FIELDS, req.body || {});
    logActivity("about_updated", "อัปเดตเนื้อหาหน้าประวัติบริษัท (History)");
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
}

// ---------------- Products page ----------------

const PRODUCTS_PAGE_FIELDS = [
  "hero_meta_en", "hero_meta_th",
  "hero_title_en", "hero_title_th",
  "hero_sub_en", "hero_sub_th",
  "brands_eyebrow_en", "brands_eyebrow_th",
  "categories_eyebrow_en", "categories_eyebrow_th",
  "cta_title_en", "cta_title_th",
];

export async function getProductsPageContent(req, res) {
  try {
    res.json(await getSingleton("products_page_content"));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load products page content" });
  }
}

export async function updateProductsPageContent(req, res) {
  try {
    const row = await upsertSingleton("products_page_content", PRODUCTS_PAGE_FIELDS, req.body || {});
    logActivity("products_page_updated", "อัปเดตเนื้อหาหน้าสินค้า");
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
}

// ---------------- Contact Us ----------------

const CONTACTS_PAGE_FIELDS = [
  "hero_meta_en", "hero_meta_th",
  "hero_title_en", "hero_title_th",
  "hero_sub_en", "hero_sub_th",
  "info_eyebrow_en", "info_eyebrow_th",
  "info_title_en", "info_title_th",
  "head_office_label_en", "head_office_label_th",
  "head_office_address_en", "head_office_address_th",
  "head_office_phone", "head_office_email",
  "warehouse_label_en", "warehouse_label_th",
  "warehouse_address_en", "warehouse_address_th",
  "warehouse_phone", "warehouse_email",
  "map_eyebrow_en", "map_eyebrow_th",
  "map_title_en", "map_title_th",
];

export async function getContactsPageContent(req, res) {
  try {
    res.json(await getSingleton("contacts_page_content"));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load contact page content" });
  }
}

export async function updateContactsPageContent(req, res) {
  try {
    const row = await upsertSingleton("contacts_page_content", CONTACTS_PAGE_FIELDS, req.body || {});
    logActivity("contacts_page_updated", "อัปเดตเนื้อหาหน้าติดต่อเรา");
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
}

// ---------------- Footer ----------------

const FOOTER_FIELDS = [
  "tagline_en", "tagline_th",
  "rights_en", "rights_th",
  "authorized_line_en", "authorized_line_th",
];

export async function getFooterContent(req, res) {
  try {
    res.json(await getSingleton("footer_content"));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load footer content" });
  }
}

export async function updateFooterContent(req, res) {
  try {
    const row = await upsertSingleton("footer_content", FOOTER_FIELDS, req.body || {});
    logActivity("footer_updated", "อัปเดตเนื้อหา Footer");
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
}

// ---------------- Automation Solution (hero only) ----------------

const AUTOMATION_SOLUTION_FIELDS = [
  "hero_meta_en", "hero_meta_th",
  "hero_title_en", "hero_title_th",
  "hero_sub_en", "hero_sub_th",
];

export async function getAutomationSolutionContent(req, res) {
  try {
    res.json(await getSingleton("automation_solution_page_content"));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load automation solution content" });
  }
}

export async function updateAutomationSolutionContent(req, res) {
  try {
    const row = await upsertSingleton(
      "automation_solution_page_content",
      AUTOMATION_SOLUTION_FIELDS,
      req.body || {}
    );
    logActivity("automation_solution_updated", "อัปเดตเนื้อหาหน้าโซลูชันระบบอัตโนมัติ");
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
}
