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

// List of image URLs (array or JSON string) -> JSON string of the safe ones, or null.
function cleanImageList(raw, max) {
  let list = raw;
  if (typeof list === "string") {
    try {
      list = JSON.parse(list);
    } catch {
      list = [];
    }
  }
  const urls = (Array.isArray(list) ? list : []).map(cleanHeroBg).filter(Boolean).slice(0, max);
  return urls.length ? JSON.stringify(urls) : null;
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
  // "Why TRISAK Group" section (migration 051)
  "why_title_en", "why_title_th",
  "why_lede_en", "why_lede_th",
  "why_process_title_en", "why_process_title_th",
  "why_reasons",
  "why_steps",
  "why_bg_image",
  // "Our Experience" banner + "Partners & Brands" heading (migration 052)
  "exp_eyebrow_en", "exp_eyebrow_th",
  "exp_title_en", "exp_title_th",
  "exp_lede_en", "exp_lede_th",
  "exp_image",
  "exp_images",
  "partners_eyebrow_en", "partners_eyebrow_th",
  "partners_title_en", "partners_title_th",
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
    body.why_bg_image = cleanHeroBg(body.why_bg_image);
    body.exp_images = cleanImageList(body.exp_images, 12);
    // the single-photo column follows the list, for anything still reading it
    if (body.exp_images) body.exp_image = JSON.parse(body.exp_images)[0];
    body.exp_image = cleanHeroBg(body.exp_image);
    body.why_reasons = cleanIconList(body.why_reasons, "why_reasons", ["title", "body"]);
    body.why_steps = cleanIconList(body.why_steps, "why_steps", ["title", "body"]);
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
/**
 * A list of icon items stored as JSON text (process steps, "why" reasons):
 * keep at most `max` items, a valid icon, the given text fields as trimmed
 * strings (heading max 120, body max 400 chars), and drop items without text.
 * Empty -> NULL so the public page falls back to its built-in list.
 */
function cleanIconList(raw, name, [headKey, bodyKey], max = 8) {
  if (raw === undefined || raw === null || raw === "") return null;
  let list;
  try {
    list = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    throw new Error(`${name} must be valid JSON`);
  }
  if (!Array.isArray(list)) throw new Error(`${name} must be a list`);
  const str = (v, n) => (typeof v === "string" ? v.trim().slice(0, n) : "");
  const items = list
    .slice(0, max)
    .map((item) => ({
      icon: cleanStepIcon(item?.icon),
      [`${headKey}_en`]: str(item?.[`${headKey}_en`], 120),
      [`${headKey}_th`]: str(item?.[`${headKey}_th`], 120),
      [`${bodyKey}_en`]: str(item?.[`${bodyKey}_en`], 400),
      [`${bodyKey}_th`]: str(item?.[`${bodyKey}_th`], 400),
    }))
    .filter((item) => Object.entries(item).some(([k, v]) => k !== "icon" && v));
  return items.length ? JSON.stringify(items) : null;
}

const cleanProcessSteps = (raw) => cleanIconList(raw, "process_steps", ["label", "desc"]);

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
