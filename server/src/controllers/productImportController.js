import ExcelJS from "exceljs";
import pool from "../config/db.js";
import { logActivity } from "../utils/activityLog.js";
import { generateSlugFromItemNo, normalizeItemNo, validateItemNo } from "../utils/productSlug.js";

// ============================================================
// Product Management — Excel Import/Export.
//
// The import fills the catalog table (/products finder): it reads only
// Item No., Item Description (the product name), Brand and Item Status, plus an
// optional Category (left empty when blank) and Series (created when new). Every other product field
// (model, descriptions, features, specs, images, documents) is
// managed on the product's Edit page and never touched by an import.
//
// ITEM NO is the import's key. The "Item No." column (or "Slug")
// holds the product's ITEM NO, kept exactly as written in products.item_no
// (spaces and letter case preserved). The product URL slug is generated from
// it: trimmed, whitespace runs -> one hyphen ("CIMR JT2A0010BAA" ->
// "CIMR-JT2A0010BAA"); see utils/productSlug.js. Nothing is generated from the
// product name. An ITEM NO may contain only letters, numbers, spaces and
// hyphens; anything else is reported and the row is skipped, never "fixed".
//
// Matching a row to an existing product (never merged silently):
//   1. same ITEM NO as a product's stored item_no          -> update that product
//      (its slug / URL is left as it is)
//   2. no item_no match, but the ITEM NO equals the slug of a legacy product
//      that has no ITEM NO recorded yet                     -> update it and
//      record the ITEM NO (old exports, whose Slug column held the slug, keep
//      working; the URL does not change)
//   3. anything else that would collide is an error, reported in the preview:
//      ITEM NO differing only by letter case from an existing one; a generated
//      slug already used by another product (different ITEM NO, or a legacy
//      product whose slug differs from this ITEM NO), also case-insensitively;
//      a slug that is a retired URL of another product (it redirects there).
//   4. otherwise                                            -> new product
// In the file itself, duplicate ITEM NOs and different ITEM NOs that generate
// the same slug are both reported (only the first row proceeds).
// On update only name, brand, ITEM NO, Item Status and (when given) category / series
// are written; on create the rest default to empty.
//
// STATUS: the required "Item Status" column is the only status value read from
// Excel. It is stored in products.item_status and exported unchanged; the
// database derives products.availability_status from it:
//   Active                                     → Available
//   Discontinued, replacement product linked   → Replacement Available
//   Discontinued, no replacement               → Discontinued
// Stock quantity plays no part (an "In Stock" column in older files is
// ignored). A missing or invalid Item Status is reported: a new product is
// rejected; an existing product is imported with its status left unchanged
// and flagged for review. Replacement links are managed by admins only: an
// import never sets, changes or clears them.
// ============================================================

// Internal field key -> Excel header used by the export / template, in column
// order. Import maps values by header (any order), accepting COLUMN_ALIASES.
const EXCEL_HEADERS = {
  Slug: "Item No.", // = ITEM NO
  Name: "Item Description",
  Brand: "Brand",
  Category: "Category",
  Series: "Series",
  "Item Status": "Item Status", // Active | Discontinued
};
export const PRODUCT_EXCEL_COLUMNS = Object.values(EXCEL_HEADERS);
// normalized header names, first match wins
const COLUMN_ALIASES = {
  Slug: ["item no.", "item no", "itemno", "item_no", "item-no", "slug"],
  Name: ["item description", "name"],
  Brand: ["brand"],
  Category: ["category"],
  Series: ["series"],
  "Item Status": ["item status", "itemstatus", "item_status"],
};
const REQUIRED_COLUMNS = ["Slug", "Name", "Brand", "Item Status"]; // Category and Series are optional

const ITEM_STATUSES = ["Active", "Discontinued"];

// Same rule as the generated column products.availability_status (migration 035).
function websiteStatus(itemStatus, hasReplacement) {
  if (itemStatus !== "Discontinued") return "available";
  return hasReplacement ? "replacement_available" : "discontinued";
}

function normalizeHeader(s) {
  return (s || "").toString().trim().toLowerCase();
}

// ExcelJS cell values can be a plain string/number, a Date, a rich-text
// object, or a formula-result object — normalize all of them to plain text.
function cellText(value) {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    if (Array.isArray(value.richText)) return value.richText.map((t) => t.text).join("");
    if (value.text != null) return String(value.text);
    if (value.result != null) return String(value.result);
    return "";
  }
  return String(value).trim();
}

/**
 * Validates an Item Status cell (letter case ignored).
 * Returns { itemStatus: "Active" | "Discontinued" | null, problem }.
 */
export function parseItemStatus(raw) {
  const text = (raw ?? "").toString().trim();
  if (!text) return { itemStatus: null, problem: "Item Status is missing" };
  const itemStatus = ITEM_STATUSES.find((v) => v.toLowerCase() === text.toLowerCase());
  if (!itemStatus) return { itemStatus: null, problem: `Item Status "${text}" is not valid (use Active or Discontinued)` };
  return { itemStatus, problem: null };
}

// ---------------- shared: DB lookups + per-row validation ----------------
// Used by both the dry-run preview and the real commit, so the two can
// never disagree about what's valid.

// Keeps every product-lookup map in step. Used when loading and again after a
// row of the current batch inserts a product, so later rows see it.
function registerProduct(lookups, p) {
  const entry = { id: p.id, slug: p.slug, item_no: p.item_no ?? null, categoryId: p.category_id ?? null,categoryId: p.category_id ?? null, hasReplacement: p.replacement_product_id != null };
  lookups.bySlug.set(p.slug, entry);
  lookups.bySlugKey.set(p.slug.toLowerCase(), entry);
  if (entry.item_no) lookups.byItemNoKey.set(entry.item_no.toLowerCase(), entry);
  lookups.statusBySlug.set(p.slug, p.availability_status);
}

// Same slug rule as the admin series form (slugify in AdminSeriesForm.jsx).
const seriesSlug = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
const seriesKey = (brandId, categoryId, part) => `${brandId}::${categoryId}::${part}`;

// A series is found by name or by slug within its brand + category (slug is unique there).
function registerSeries(lookups, s) {
  lookups.seriesByKey.set(seriesKey(s.brand_id, s.category_id, `name:${normalizeHeader(s.name)}`), s.id);
  lookups.seriesByKey.set(seriesKey(s.brand_id, s.category_id, `slug:${s.slug}`), s.id);
}

const findSeries = (lookups, s) =>
  lookups.seriesByKey.get(seriesKey(s.brandId, s.categoryId, `name:${normalizeHeader(s.name)}`)) ||
  lookups.seriesByKey.get(seriesKey(s.brandId, s.categoryId, `slug:${s.slug}`)) ||
  null;

async function loadLookups() {
  const [brandsRes, categoriesRes, seriesRes, productsRes, historyRes] = await Promise.all([
    pool.query("SELECT id, name FROM brands"),
    pool.query("SELECT id, name FROM categories"),
    pool.query("SELECT id, name, slug, brand_id, category_id FROM series"),
    pool.query("SELECT id, slug, item_no, category_id, availability_status, replacement_product_id FROM products"),
    pool.query(
      `SELECT h.old_slug, p.slug AS current_slug, p.item_no
       FROM product_slug_history h JOIN products p ON p.id = h.product_id`
    ),
  ]);
  const lookups = {
    brandsByName: new Map(brandsRes.rows.map((b) => [normalizeHeader(b.name), b.id])),
    categoriesByName: new Map(categoriesRes.rows.map((c) => [normalizeHeader(c.name), c.id])),
    seriesByKey: new Map(), // "brandId::categoryId::name|slug" -> series id (see registerSeries)
    byItemNoKey: new Map(), // lower-cased item_no -> { id, slug, item_no }
    bySlug: new Map(), // exact slug -> { id, slug, item_no }
    bySlugKey: new Map(), // lower-cased slug -> same entry (case-only collisions)
    statusBySlug: new Map(),
    // retired slugs that still redirect to a product
    historyBySlugKey: new Map(historyRes.rows.map((h) => [h.old_slug.toLowerCase(), h])),
  };
  seriesRes.rows.forEach((s) => registerSeries(lookups, s));
  productsRes.rows.forEach((p) => registerProduct(lookups, p));
  return lookups;
}

// Index of the whole file, so messages can name every row involved:
//   byItemNo  lower-cased ITEM NO       -> { itemNo, rows[] }
//   bySlug    lower-cased generated slug -> { slug, items: [{ rowNumber, itemNo }] }
// Only ITEM NOs that pass validation are indexed; invalid / blank values are
// reported per row.
function indexItemNoRows(entries) {
  const byItemNo = new Map();
  const bySlug = new Map();
  for (const { rowNumber, raw } of entries) {
    const itemNo = normalizeItemNo(raw && raw.Slug);
    if (!itemNo || validateItemNo(itemNo)) continue;
    const slug = generateSlugFromItemNo(itemNo);
    const itemKey = itemNo.toLowerCase();
    const slugKey = slug.toLowerCase();
    if (!byItemNo.has(itemKey)) byItemNo.set(itemKey, { itemNo, rows: [] });
    byItemNo.get(itemKey).rows.push(rowNumber);
    if (!bySlug.has(slugKey)) bySlug.set(slugKey, { slug, items: [] });
    bySlug.get(slugKey).items.push({ rowNumber, itemNo });
  }
  return { byItemNo, bySlug };
}

const newSeen = () => ({ itemNos: new Map(), slugs: new Map() });

/**
 * Validates + resolves one Excel row against the current DB state.
 * `seen` is shared across a whole import batch (see newSeen) so duplicates
 * within the same file are caught — only the first occurrence proceeds.
 * `index` (from indexItemNoRows) lists every row using each ITEM NO / generated
 * slug so the messages can name them all.
 */
function resolveRow(rowNumber, raw, lookups, seen, index = { byItemNo: new Map(), bySlug: new Map() }) {
  const errors = [];
  const warnings = [];

  const name = (raw.Name || "").toString().trim();
  // The first column is the ITEM NO, kept exactly as written; the URL slug is derived from it.
  const itemNo = normalizeItemNo(raw.Slug);
  const generatedSlug = generateSlugFromItemNo(itemNo);
  const itemKey = itemNo.toLowerCase(); // comparison keys only (duplicate / collision checks)
  const slugKey = generatedSlug.toLowerCase();
  const brandName = (raw.Brand || "").toString().trim();
  const categoryName = (raw.Category || "").toString().trim();

  if (!name) errors.push("Item Description is required");

  // ---- ITEM NO / slug ----
  let target = null; // existing product this row updates
  const itemNoError = validateItemNo(itemNo);
  if (itemNoError) {
    errors.push(itemNoError);
  } else {
    // 1) duplicates inside the file
    let fileConflict = false;
    const rowsUsing = index.byItemNo.get(itemKey)?.rows || [rowNumber];
    const slugItems = index.bySlug.get(slugKey)?.items || [{ rowNumber, itemNo }];
    if (seen.itemNos.has(itemKey)) {
      fileConflict = true;
      errors.push(
        `Duplicate ITEM NO "${itemNo}" in file (first used by row ${seen.itemNos.get(itemKey)}; appears in rows ${rowsUsing.join(", ")})`
      );
    } else if (seen.slugs.has(slugKey)) {
      fileConflict = true;
      const first = seen.slugs.get(slugKey);
      errors.push(
        `Generated URL slug "${generatedSlug}" is the same for different ITEM NOs: "${first.itemNo}" (row ${first.rowNumber}) and "${itemNo}" (row ${rowNumber}). They would share one product URL, so this row is skipped — give them distinct ITEM NOs`
      );
    } else {
      seen.itemNos.set(itemKey, rowNumber);
      seen.slugs.set(slugKey, { rowNumber, itemNo });
      const sameItem = rowsUsing.filter((n) => n !== rowNumber);
      const sameSlug = slugItems.filter((i) => i.itemNo.toLowerCase() !== itemKey);
      if (sameItem.length) {
        warnings.push(`ITEM NO "${itemNo}" is repeated in row(s) ${sameItem.join(", ")} — only this first row will be imported`);
      }
      if (sameSlug.length) {
        warnings.push(
          `URL slug "${generatedSlug}" is also generated by ITEM NO ${sameSlug.map((i) => `"${i.itemNo}" (row ${i.rowNumber})`).join(", ")} — only this first row will be imported`
        );
      }
    }

    // 2) existing products — never merged on a normalised-slug match alone
    if (!fileConflict) {
      const byItem = lookups.byItemNoKey.get(itemKey);
      if (byItem) {
        if (byItem.item_no === itemNo) {
          target = byItem; // same ITEM NO -> update; its URL is not touched
          if (byItem.slug !== generatedSlug) {
            warnings.push(`Existing URL slug "${byItem.slug}" is kept (the slug generated from this ITEM NO would be "${generatedSlug}")`);
          }
        } else {
          errors.push(
            `ITEM NO "${itemNo}" conflicts with existing product ITEM NO "${byItem.item_no}" (differs only by letter case)`
          );
        }
      } else {
        const bySlugExact = lookups.bySlug.get(generatedSlug);
        const bySlugCase = lookups.bySlugKey.get(slugKey);
        const retired = lookups.historyBySlugKey.get(slugKey);
        if (bySlugExact && bySlugExact.item_no == null && itemNo === bySlugExact.slug) {
          // legacy product (no ITEM NO recorded): matched by its current slug, as old exports did
          target = bySlugExact;
          warnings.push(`Matched existing product by its current slug "${bySlugExact.slug}"; ITEM NO "${itemNo}" will be recorded on it (its URL does not change)`);
        } else if (bySlugExact && bySlugExact.item_no == null) {
          errors.push(
            `URL slug "${generatedSlug}" is already used by an existing product that has no ITEM NO recorded. It is not merged with ITEM NO "${itemNo}" — to update that product use its current slug "${bySlugExact.slug}" as the ITEM NO, otherwise choose a different ITEM NO`
          );
        } else if (bySlugExact) {
          errors.push(
            `URL slug "${generatedSlug}" (from ITEM NO "${itemNo}") is already used by existing product ITEM NO "${bySlugExact.item_no}". Different ITEM NOs are not merged — choose a different ITEM NO`
          );
        } else if (bySlugCase) {
          errors.push(
            `URL slug "${generatedSlug}" (from ITEM NO "${itemNo}") differs only by letter case from existing product slug "${bySlugCase.slug}"`
          );
        } else if (retired) {
          errors.push(
            `URL slug "${generatedSlug}" (from ITEM NO "${itemNo}") was previously used by another product and still redirects to its current page "${retired.current_slug}" — choose a different ITEM NO`
          );
        }
      }
    }
  }
  // An updated product keeps its own slug (URL); a new one gets the generated slug.
  const slug = target ? target.slug : generatedSlug;

  let brandId = null;
  if (!brandName) errors.push("Brand is required");
  else {
    brandId = lookups.brandsByName.get(normalizeHeader(brandName)) || null;
    if (!brandId) errors.push(`Brand "${brandName}" was not found`);
  }

  // optional: blank (or unknown) leaves the category empty on a new product and
  // unchanged on an existing one
  let categoryId = null;
  if (categoryName) {
    categoryId = lookups.categoriesByName.get(normalizeHeader(categoryName)) || null;
    if (!categoryId) warnings.push(`Category "${categoryName}" was not found — left blank`);
  }

  // optional: an existing series of this brand + category is linked; an unknown one is
  // created on import. Blank keeps an existing product's series.
  const seriesName = (raw.Series || "").toString().trim();
  const seriesCategoryId = categoryId || target?.categoryId || null;
  let series = null; // { name, slug, brandId, categoryId, id (null = will be created) }
  if (seriesName && brandId) {
    const slugValue = seriesSlug(seriesName);
    if (!seriesCategoryId) {
      warnings.push(`Series "${seriesName}" needs a Category — left blank`);
    } else if (!slugValue) {
      warnings.push(`Series "${seriesName}" has no English letters or numbers for its URL — left blank`);
    } else {
      series = { name: seriesName.slice(0, 150), slug: slugValue.slice(0, 150), brandId, categoryId: seriesCategoryId };
      series.id = findSeries(lookups, series);
      if (!series.id) warnings.push(`New series "${seriesName}" will be created`);
    }
  }

  const exists = Boolean(target);

  // ---- status: from Item Status only ----
  const { itemStatus, problem: itemStatusProblem } = parseItemStatus(raw["Item Status"]);
  const availability = {
    current: exists ? lookups.statusBySlug.get(slug) || null : null,
    next: itemStatus ? websiteStatus(itemStatus, Boolean(target?.hasReplacement)) : null,
    changed: false,
    needsReview: Boolean(itemStatusProblem),
    itemStatus, // value to store (null → leave the stored Item Status alone)
  };
  availability.changed = availability.next != null && availability.next !== availability.current;
  if (itemStatusProblem) {
    if (exists) warnings.push(`Needs review: ${itemStatusProblem}. Status left unchanged.`);
    else errors.push(`${itemStatusProblem} — a new product needs Active or Discontinued`);
  }

  const action = errors.length ? "error" : exists ? "update" : "add";

  return {
    rowNumber,
    raw: {
      // same order as the Excel columns (EXCEL_HEADERS)
      Slug: itemNo,
      Name: name,
      Brand: brandName,
      Category: categoryName,
      Series: seriesName,
      "Item Status": (raw["Item Status"] ?? "").toString().trim(),
    },
    resolved: {
      name,
      itemNo,
      slug,
      existingId: target ? target.id : null,
      brandId,
      categoryId,
      series,
    },
    availability,
    action,
    errors,
    warnings,
  };
}

async function readWorkbookRows(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return { missingColumns: REQUIRED_COLUMNS.map((k) => EXCEL_HEADERS[k]), rows: [] };

  const headerMap = {}; // normalized header -> column index
  sheet.getRow(1).eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headerMap[normalizeHeader(cellText(cell.value)).replace(/\s+/g, " ")] = colNumber;
  });

  // field key -> column index; other columns in the file are ignored
  const columns = {};
  for (const [key, aliases] of Object.entries(COLUMN_ALIASES)) {
    const alias = aliases.find((a) => a in headerMap);
    if (alias) columns[key] = headerMap[alias];
  }
  const slugSource = "slug" in headerMap && columns.Slug === headerMap.slug ? "Slug" : "ITEM NO";

  const missingColumns = REQUIRED_COLUMNS.filter((key) => columns[key] === undefined).map((key) => EXCEL_HEADERS[key]);
  if (missingColumns.length) return { missingColumns, rows: [] };

  const rows = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // header row
    const raw = {};
    let hasAny = false;
    for (const [key, colNumber] of Object.entries(columns)) {
      const val = cellText(row.getCell(colNumber).value);
      raw[key] = val;
      if (val) hasAny = true;
    }
    if (hasAny) rows.push({ rowNumber, raw });
  });

  return { missingColumns: [], rows, slugSource };
}

// ---------------- export ----------------

function columnWidth(header) {
  const widths = {
    "Item No.": 24,
    "Item Description": 40,
    Brand: 16,
    Category: 18,
    Series: 18,
    "Item Status": 14,
  };
  return widths[header] || 20;
}

export async function exportProductsExcel(req, res) {
  try {
    const productsRes = await pool.query(
      `SELECT p.name, p.slug, p.item_no, p.item_status, b.name AS brand, c.name AS category, s.name AS series
       FROM products p
       JOIN brands b ON b.id = p.brand_id
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN series s ON s.id = p.series_id
       ORDER BY p.sort_order`
    );

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "TRISAK GROUP Admin";
    workbook.created = new Date();
    const sheet = workbook.addWorksheet("Products");
    sheet.columns = PRODUCT_EXCEL_COLUMNS.map((header) => ({
      header,
      key: header,
      width: columnWidth(header),
      // ITEM NO is text: keeps leading zeros when the file is edited and re-imported
      ...(header === EXCEL_HEADERS.Slug ? { style: { numFmt: "@" } } : {}),
    }));
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: "frozen", ySplit: 1 }];

    for (const p of productsRes.rows) {
      sheet.addRow({
        // the original ITEM NO; legacy products without one fall back to their slug,
        // so the file still re-imports onto the same product
        [EXCEL_HEADERS.Slug]: p.item_no || p.slug,
        [EXCEL_HEADERS.Name]: p.name,
        Brand: p.brand,
        Category: p.category || "",
        Series: p.series || "",
        "Item Status": p.item_status, // stored as-is: Active | Discontinued
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `trisak-products-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to export products" });
  }
}

// ---------------- import template (headers only, no data rows) ----------------

const TEMPLATE_ROWS = 2000; // rows that get the Item Status dropdown

export async function downloadProductImportTemplate(req, res) {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "TRISAK GROUP Admin";
    workbook.created = new Date();

    // First sheet = the one the import reads. Headers only: no sample row, so
    // nothing placeholder can be imported by accident.
    const sheet = workbook.addWorksheet("Products");
    sheet.columns = PRODUCT_EXCEL_COLUMNS.map((header) => ({
      header,
      key: header,
      width: columnWidth(header),
      ...(header === EXCEL_HEADERS.Slug ? { style: { numFmt: "@" } } : {}), // text: keep leading zeros
    }));
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: "frozen", ySplit: 1 }];

    const col = (header) => PRODUCT_EXCEL_COLUMNS.indexOf(header) + 1;
    for (let r = 2; r <= TEMPLATE_ROWS + 1; r += 1) {
      sheet.getCell(r, col("Item Status")).dataValidation = {
        type: "list",
        formulae: ['"Active,Discontinued"'],
        allowBlank: true,
        showErrorMessage: true,
        errorTitle: "Item Status",
        error: "Item Status must be Active or Discontinued.",
      };
    }

    const help = workbook.addWorksheet("Instructions");
    help.columns = [{ width: 24 }, { width: 100 }];
    const notes = [
      ["Item No.", "Required. The product's ITEM NO, stored exactly as written. It may contain letters, numbers, spaces and hyphens only. The product's URL slug is generated from it: spaces become hyphens (CIMR JT2A0010BAA -> CIMR-JT2A0010BAA). Must be unique in the file, and so must the generated slug. A product with the same ITEM NO is updated; a new ITEM NO creates a product. Different ITEM NOs are never merged."],
      ["Item Description", "Required. The product name."],
      ["Brand", "Required. Must match an existing brand name."],
      ["Category", "Optional. Must match an existing category name; blank (or not found) leaves it empty on a new product and unchanged on an existing one."],
      ["Series", "Optional. An existing series of this Brand + Category is linked; a new name creates the series (it needs a Category, from this row or already on the product). Blank keeps an existing product's series."],
      ["Other columns", "Ignored. Model, descriptions, features, specifications, images and documents are edited on the product's page in admin."],
      ["Item Status", "Required: Active or Discontinued. It sets the product status on the website: Active → Available; Discontinued → Discontinued, or Replacement Available when an admin has linked a replacement product. A new product without a valid Item Status is not imported; an existing one keeps its current status and is flagged for review. Replacement products are managed by admins and are never changed by an import."],
      ["Column order", "Columns are matched by header name, so their order in your file does not matter."],
    ];
    notes.forEach((n) => help.addRow(n));
    help.getColumn(1).font = { bold: true };
    help.getColumn(2).alignment = { wrapText: true, vertical: "top" };

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="trisak-products-import-template.xlsx"');
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create the import template" });
  }
}

// ---------------- import: preview (dry run — no DB writes) ----------------

export async function parseProductImport(req, res) {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  try {
    const { missingColumns, rows, slugSource } = await readWorkbookRows(req.file.buffer);
    if (missingColumns.length) {
      return res.status(400).json({
        error: `The file is missing required column(s): ${missingColumns.join(", ")}`,
        missingColumns,
      });
    }
    if (!rows.length) {
      return res.status(400).json({ error: "The file has no data rows to import" });
    }

    const lookups = await loadLookups();
    const seen = newSeen();
    const index = indexItemNoRows(rows);
    const results = rows.map(({ rowNumber, raw }) => resolveRow(rowNumber, raw, lookups, seen, index));

    // Repeats inside the file — surfaced up front, before anything is committed
    const duplicateItemNos = [...index.byItemNo.values()]
      .filter((v) => v.rows.length > 1)
      .map((v) => ({ itemNo: v.itemNo, rows: v.rows }));
    // different ITEM NOs that generate the same URL slug
    const duplicateSlugs = [...index.bySlug.values()]
      .filter((v) => new Set(v.items.map((i) => i.itemNo.toLowerCase())).size > 1)
      .map((v) => ({ slug: v.slug, items: v.items }));

    const summary = results.reduce(
      (acc, r) => {
        acc.total += 1;
        if (r.action === "add") acc.toAdd += 1;
        else if (r.action === "update") acc.toUpdate += 1;
        else acc.toError += 1;
        return acc;
      },
      { total: 0, toAdd: 0, toUpdate: 0, toError: 0 }
    );

    // Projected catalogue-wide status counts if this file were imported now.
    const projected = new Map(lookups.statusBySlug);
    const fromFile = { available: 0, discontinued: 0, replacement_available: 0 };
    let needsReview = 0;
    let statusChanges = 0;
    for (const r of results) {
      if (r.availability.needsReview) needsReview += 1;
      if (r.action === "error" || !r.availability.next) continue;
      projected.set(r.resolved.slug, r.availability.next);
      fromFile[r.availability.next] += 1;
      if (r.availability.changed) statusChanges += 1;
    }
    const resulting = { available: 0, discontinued: 0, replacement_available: 0 };
    for (const status of projected.values()) if (status in resulting) resulting[status] += 1;

    res.json({
      summary,
      slugSource,
      duplicateItemNos,
      duplicateSlugs,
      rows: results,
      statusSummary: { resulting, fromFile, needsReview, statusChanges },
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Could not read that file — make sure it's a valid .xlsx export." });
  }
}

// ---------------- import: commit (writes to the DB) ----------------

export async function commitProductImport(req, res) {
  const items = Array.isArray(req.body?.rows) ? req.body.rows : null;
  if (!items || !items.length) return res.status(400).json({ error: "No rows to import" });

  let added = 0;
  let updated = 0;
  let skipped = 0;
  let statusUpdated = 0;
  let seriesCreated = 0;
  const errors = [];
  const reviewed = []; // imported rows whose Item Status was invalid (status left unchanged)

  const client = await pool.connect();
  try {
    // Re-validate against the DB's current state at commit time (never
    // trust anything the client resolved earlier — brands/categories/
    // other products may have changed since the preview was shown).
    const lookups = await loadLookups();
    const seen = newSeen();
    const index = indexItemNoRows(
      items.map((item) => ({ rowNumber: item?.rowNumber, raw: item && typeof item === "object" && item.raw ? item.raw : item }))
    );

    for (const item of items) {
      const raw = item && typeof item === "object" && item.raw ? item.raw : item;
      const rowNumber = item?.rowNumber;
      const { resolved, errors: rowErrors, warnings: rowWarnings, availability } = resolveRow(rowNumber, raw || {}, lookups, seen, index);

      if (rowErrors.length) {
        skipped += 1;
        errors.push({ rowNumber, slug: raw?.Slug, errors: rowErrors });
        continue;
      }

      const r = resolved;
      try {
        await client.query("BEGIN");
        const existingId = r.existingId; // matched by ITEM NO (see resolveRow)

        // series named in the file: link it, creating it the first time it appears
        // (an earlier row of this batch may already have created it)
        let seriesId = null;
        let createdSeries = false;
        if (r.series) {
          seriesId = findSeries(lookups, r.series);
          if (!seriesId) {
            const { rows: seriesRows } = await client.query(
              `INSERT INTO series (name, slug, brand_id, category_id, sort_order)
               VALUES ($1, $2, $3, $4,
                 (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM series WHERE brand_id = $3 AND category_id = $4))
               ON CONFLICT (brand_id, category_id, slug) DO UPDATE SET slug = EXCLUDED.slug
               RETURNING id`,
              [r.series.name, r.series.slug, r.series.brandId, r.series.categoryId]
            );
            seriesId = seriesRows[0].id;
            createdSeries = true;
          }
        }

        let productId;
        if (existingId) {
          // Only the Excel-managed fields are touched; a blank Category / Series keeps the stored one.
          await client.query(
            `UPDATE products SET
               name = $1, brand_id = $2, category_id = COALESCE($3, category_id),
               series_id = COALESCE($4, series_id), item_no = $5, updated_at = now()
             WHERE id = $6`,
            [
              r.name,
              r.brandId,
              r.categoryId,
              seriesId,
              r.itemNo, // same value on a normal update; recorded once on a legacy product
              existingId,
            ]
          );
          productId = existingId;
        } else {
          const { rows: maxRows } = await client.query(
            "SELECT COALESCE(MAX(sort_order), 0) + 1 AS n FROM products"
          );
          const insertRes = await client.query(
            `INSERT INTO products
               (name, slug, brand_id, category_id, series_id, sort_order, item_no)
             VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
            [r.name, r.slug, r.brandId, r.categoryId, seriesId, maxRows[0].n, r.itemNo]
          );
          productId = insertRes.rows[0].id;
        }

        // Status: store a valid Item Status (the database derives the website
        // status; replacement links are never touched). The timestamp moves
        // only on a real change.
        if (availability.itemStatus) {
          await client.query(
            `UPDATE products SET
               item_status = $1,
               status_updated_at = CASE WHEN $2 THEN now() ELSE status_updated_at END
             WHERE id = $3`,
            [availability.itemStatus, availability.changed, productId]
          );
        }

        await client.query("COMMIT");
        // keep lookups fresh within this batch (a later row can then see this product / series)
        if (createdSeries) {
          registerSeries(lookups, { id: seriesId, name: r.series.name, slug: r.series.slug, brand_id: r.series.brandId, category_id: r.series.categoryId });
          seriesCreated += 1;
        }
        const hadReplacement = Boolean(existingId && lookups.bySlug.get(r.slug)?.hasReplacement);
        registerProduct(lookups, {
          id: productId,
          slug: r.slug,
          item_no: r.itemNo,
          category_id: r.categoryId ?? lookups.bySlug.get(r.slug)?.categoryId ?? null,
          availability_status: availability.next ?? availability.current,
          replacement_product_id: hadReplacement ? true : null, // only its presence is used
        });
        if (existingId) updated += 1;
        else added += 1;
        if (availability.changed) statusUpdated += 1;
        if (availability.needsReview) reviewed.push({ rowNumber, slug: r.slug, messages: rowWarnings });
      } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        skipped += 1;
        errors.push({ rowNumber, slug: raw?.Slug, errors: [err.message] });
      }
    }

    logActivity(
      "product_import",
      `นำเข้าสินค้าจาก Excel: เพิ่ม ${added}, แก้ไข ${updated}, ข้าม ${skipped}, อัปเดตสถานะ ${statusUpdated}, สร้าง series ใหม่ ${seriesCreated}`
    );

    res.json({ added, updated, skipped, errors, statusUpdated, seriesCreated, reviewed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Import failed" });
  } finally {
    client.release();
  }
}
