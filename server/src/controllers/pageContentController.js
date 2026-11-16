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

// Hero background: same-site upload path or http(s) URL only; anything else -> null.
function cleanHeroBg(value) {
  const bg = typeof value === "string" ? value.trim() : "";
  return bg && bg.length <= 255 && (/^\/(?![/\\])\S*$/.test(bg) || /^https?:\/\/[^\s<>"']+$/i.test(bg)) ? bg : null;
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
  "hero_bg_image",
  "intro_image",
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
    const body = { ...(req.body || {}) };
    body.hero_bg_image = cleanHeroBg(body.hero_bg_image);
    body.intro_image = cleanHeroBg(body.intro_image);
    const row = await upsertSingleton("about_content", ABOUT_FIELDS, body);
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
  "hero_bg_image",
  "hero_bg_images",
  "brands_eyebrow_en", "brands_eyebrow_th",
  "categories_eyebrow_en", "categories_eyebrow_th",
  "cta_title_en", "cta_title_th",
];

const MAX_HERO_SLIDES = 10;

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
    // Slideshow: accept an ordered array of image URLs, store it as JSONB,
    // and mirror the first slide into the legacy single-image column.
    const body = { ...(req.body || {}) };
    const images = (Array.isArray(body.hero_bg_images) ? body.hero_bg_images : [])
      .filter((u) => typeof u === "string" && u.trim() && u.length <= 255)
      .slice(0, MAX_HERO_SLIDES);
    body.hero_bg_images = JSON.stringify(images);
    body.hero_bg_image = images[0] || null;
    const row = await upsertSingleton("products_page_content", PRODUCTS_PAGE_FIELDS, body);
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
  "hero_bg_image",
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
  "head_office_map", "head_office_map_link",
  "warehouse_map", "warehouse_map_link",
  "line_id", "line_url",
  "office_hours_en", "office_hours_th",
  "line_qr_image",
  "support_phone", "support_email",
  "accounting_phone", "accounting_email",
  "company_name_en", "company_name_th", "tax_id",
  "vendor_docs", "faq", // JSON text, see migration 047
  "head_office_photo", "warehouse_photo",
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

// ---------------- Automation Solution (hero + engineering process) ----------------

const AUTOMATION_SOLUTION_FIELDS = [
  "hero_meta_en", "hero_meta_th",
  "hero_title_en", "hero_title_th",
  "hero_sub_en", "hero_sub_th",
  "hero_bg_image",
  "process_title_en", "process_title_th",
  "process_lede_en", "process_lede_th",
  "process_steps",
];

// A step icon is a built-in icon key (components/WhyTrisak.jsx; unknown keys
// draw as "check") or an uploaded image: a same-site path or http(s) URL.
function cleanStepIcon(value) {
  const v = typeof value === "string" ? value.trim() : "";
  if (/^[a-z][a-z0-9-]{0,29}$/.test(v)) return v;
  if (v.length <= 255 && (/^\/(?![/\\])\S*$/.test(v) || /^https?:\/\/[^\s<>"'()]+$/i.test(v))) return v;
  return "check";
}
const MAX_PROCESS_STEPS = 8;

// process_steps arrives as JSON text: keep at most 8 steps, known icons,
// trimmed strings with sane lengths, and drop steps that have no text.
// Empty -> NULL so the public page falls back to the built-in steps.
function cleanProcessSteps(raw) {
  if (raw === undefined || raw === null || raw === "") return null;
  let list;
  try {
    list = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    throw new Error("process_steps must be valid JSON");
  }
  if (!Array.isArray(list)) throw new Error("process_steps must be a list");
  const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const steps = list
    .slice(0, MAX_PROCESS_STEPS)
    .map((step) => ({
      icon: cleanStepIcon(step?.icon),
      label_en: str(step?.label_en, 120),
      label_th: str(step?.label_th, 120),
      desc_en: str(step?.desc_en, 400),
      desc_th: str(step?.desc_th, 400),
    }))
    .filter((step) => step.label_en || step.label_th || step.desc_en || step.desc_th);
  return steps.length ? JSON.stringify(steps) : null;
}

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
    const body = { ...(req.body || {}) };
    body.process_steps = cleanProcessSteps(body.process_steps);
    const row = await upsertSingleton("automation_solution_page_content", AUTOMATION_SOLUTION_FIELDS, body);
    logActivity("automation_solution_updated", "อัปเดตเนื้อหาหน้าโซลูชันระบบอัตโนมัติ");
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
}

// ---------------- Career (How to Apply + HR contact) ----------------

const CAREER_PAGE_FIELDS = [
  "hero_meta_en", "hero_meta_th",
  "hero_title_en", "hero_title_th",
  "hero_sub_en", "hero_sub_th",
  "hero_bg_image",
  "apply_steps",
  "hr_name_en", "hr_name_th",
  "hr_phone", "hr_email", "hr_line_id",
];

const MAX_APPLY_STEPS = 20;

export async function getCareerPageContent(req, res) {
  try {
    res.json(await getSingleton("career_page_content"));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load career page content" });
  }
}

export async function updateCareerPageContent(req, res) {
  try {
    const body = { ...(req.body || {}) };
    // How to Apply: ordered list of { en, th }; drop rows that are blank in both languages.
    const clean = (v) => (typeof v === "string" ? v.trim().slice(0, 1000) : "");
    const steps = (Array.isArray(body.apply_steps) ? body.apply_steps : [])
      .map((s) => ({ en: clean(s?.en), th: clean(s?.th) }))
      .filter((s) => s.en || s.th)
      .slice(0, MAX_APPLY_STEPS);
    body.apply_steps = JSON.stringify(steps);
    body.hero_bg_image = cleanHeroBg(body.hero_bg_image);
    const row = await upsertSingleton("career_page_content", CAREER_PAGE_FIELDS, body);
    logActivity("career_page_updated", "อัปเดตวิธีการสมัครและข้อมูลติดต่อหน้าร่วมงานกับเรา");
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
}
