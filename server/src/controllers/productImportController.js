import ExcelJS from "exceljs";
import pool from "../config/db.js";
import { logActivity } from "../utils/activityLog.js";

// ============================================================
// Product Management — Excel Import/Export.
//
// Excel only ever carries the product's *data* fields (name, slug,
// taxonomy, description, features, specs) — never images. Images stay
// on the individual product's Edit page, managed one product at a
// time (see adminController.js products section), which also keeps
// the door open for a future bulk-image workflow keyed by
// Slug/Model without touching this format.
//
// Slug is the import's primary key: a row whose Slug already exists
// updates that product; a new Slug creates one.
//
// SLUG = ITEM NO. The Slug of a product is its ITEM NO, taken from the
// file exactly as written (letters, numbers and hyphens; case kept) and
// never generated from, or altered to match, the product name. A file may
// carry the value in a column named "Slug" (the export format) or "ITEM NO";
// ITEM NO is mapped to the internal Slug field (it wins if both exist).
// Per row it must be non-empty, <= 150 chars, letters/numbers/hyphens only,
// unique within the file (case-insensitive), and must not collide with an
// existing slug that differs only by letter case. An exact match with an
// existing slug is the normal "update that product" path. Invalid values
// are reported in the preview and are never "fixed" silently. Only the columns
// below are ever written — image_url, product_images,
// product_documents, related_products, is_new, and sort_order are
// left exactly as they were on update, and default to empty/false/
// next-in-line on create.
//
// AVAILABILITY (optional columns "In Stock" and "Item Status", located by
// header name — wherever they sit in the file; both are stored on the product
// so they export again):
//   Item Status = Discontinued            → Discontinued  (always wins, any stock)
//   Item Status = Active, In Stock > 0    → Available
//   Item Status = Active, In Stock = 0    → Unavailable
// Invalid / missing source values are flagged for review and never
// overwrite an existing status or the stored In Stock / Item Status (a new
// product with no usable values is rejected, since no status can be derived).
// The derived status is never read from Excel. "Replacement Available" and
// replacement links are managed by admins only: an import never sets,
// changes or clears them. Files without these columns leave every
// status untouched.
// ============================================================

// The optional source columns behind the derived availability status. They are
// optional on import so older files without them keep working (statuses
// simply stay untouched).
export const AVAILABILITY_EXPORT_COLUMNS = ["In Stock", "Item Status"];

// Single source of truth for the column ORDER of the Excel export, the
// downloadable import template and the import preview. Import never relies on
// it: values are mapped by column header, so files with any column order (or
// "ITEM NO" in place of "Slug") still import.
export const PRODUCT_EXCEL_COLUMNS = [
  "Slug", // = ITEM NO
  "Name",
  "In Stock", // numeric, non-negative
  "Brand",
  "Category",
  "Series",
  "Model",
  "Short Description",
  "Description",
  "Features",
  "Specifications",
  "Item Status", // Active | Discontinued
];

// Columns that must be present on import (everything except the optional
// availability source columns).
export const IMPORT_COLUMNS = PRODUCT_EXCEL_COLUMNS.filter((c) => !AVAILABILITY_EXPORT_COLUMNS.includes(c));

// Optional availability columns (header aliases, matched case-insensitively).
const AVAILABILITY_COLUMNS = {
  "In Stock": ["in stock", "instock", "in-stock"],
  "Item Status": ["item status", "itemstatus", "item_status"],
};
const ITEM_STATUSES = ["active", "discontinued"];
const MANUAL_STATUS = "replacement_available"; // admin-managed, never derived

// Multiple Features / Specifications entries live in one cell,
// separated by " | " — easier to type and read in a spreadsheet cell
// than embedded line breaks. Each Specifications entry is "Label: Value".
const LIST_SEPARATOR = " | ";
// ITEM NO used verbatim as the slug: letters (either case), numbers, hyphens.
const SLUG_RE = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/;
const SLUG_MAX_LENGTH = 150; // products.slug is VARCHAR(150)
// Header aliases (matched case-insensitively, whitespace collapsed) that map to the
// internal Slug field. ITEM NO is preferred over a plain "Slug" column.
const ITEM_NO_ALIASES = ["item no", "item no.", "itemno", "item_no", "item-no"];
const SLUG_COLUMN_LABEL = "Slug (ITEM NO)";

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

function parseListField(raw) {
  return (raw || "")
    .toString()
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseSpecsField(raw) {
  return parseListField(raw)
    .map((pair) => {
      const idx = pair.indexOf(":");
      if (idx === -1) return null;
      const label = pair.slice(0, idx).trim();
      const value = pair.slice(idx + 1).trim();
      if (!label || !value) return null;
      return { label, value };
    })
    .filter(Boolean);
}

function formatListField(arr) {
  return (arr || []).join(LIST_SEPARATOR);
}

function formatSpecsField(specs) {
  return (specs || []).map((s) => `${s.label}: ${s.value}`).join(LIST_SEPARATOR);
}

/**
 * Derives availability from the source columns.
 * Returns { status, problems, warnings }:
 *   status   "available" | "unavailable" | "discontinued", or null when it
 *            cannot be determined (then `problems` says why)
 *   itemStatus / stock   the validated source values (null when invalid)
 *   problems blocking issues (missing/invalid values)
 *   warnings non-blocking notes (e.g. bad In Stock on a Discontinued item)
 * Item Status (source) and the derived availability status are separate
 * things; Discontinued outranks stock quantity.
 */
export function deriveAvailability(instockRaw, itemStatusRaw) {
  const problems = [];
  const warnings = [];

  const itemStatusText = (itemStatusRaw ?? "").toString().trim();
  const itemStatusKey = itemStatusText.toLowerCase();
  let itemStatus = null; // "Active" | "Discontinued" when valid
  if (!itemStatusText) {
    problems.push("Item Status is missing");
  } else if (!ITEM_STATUSES.includes(itemStatusKey)) {
    problems.push(
      itemStatusKey === "inactive"
        ? 'Item Status "Inactive" is no longer supported (use Active or Discontinued)'
        : `Item Status "${itemStatusText}" is not supported (use Active or Discontinued)`
    );
  } else {
    itemStatus = itemStatusKey === "active" ? "Active" : "Discontinued";
  }

  const instockText = (instockRaw ?? "").toString().trim().replace(/[,\s]/g, "");
  let stock = null; // number when valid
  let stockProblem = null;
  if (!instockText) stockProblem = "In Stock is missing";
  else if (!/^\d+(\.\d+)?$/.test(instockText)) {
    stockProblem = `In Stock "${(instockRaw ?? "").toString().trim()}" must be a non-negative number`;
  } else stock = Number(instockText);

  if (itemStatus === "Discontinued") {
    // stock quantity is irrelevant for Discontinued items — only mention a bad value
    if (stockProblem && instockText) warnings.push(`${stockProblem} (ignored: item is Discontinued)`);
    return { status: "discontinued", itemStatus, stock, problems, warnings };
  }
  if (stockProblem) problems.push(stockProblem);
  if (problems.length) return { status: null, itemStatus, stock, problems, warnings };
  return { status: stock > 0 ? "available" : "unavailable", itemStatus, stock, problems, warnings };
}

// ---------------- shared: DB lookups + per-row validation ----------------
// Used by both the dry-run preview and the real commit, so the two can
// never disagree about what's valid.

async function loadLookups() {
  const [brandsRes, categoriesRes, seriesRes, productsRes] = await Promise.all([
    pool.query("SELECT id, name FROM brands"),
    pool.query("SELECT id, name FROM categories"),
    pool.query("SELECT id, name, brand_id, category_id FROM series"),
    pool.query("SELECT id, slug, availability_status FROM products"),
  ]);
  return {
    brandsByName: new Map(brandsRes.rows.map((b) => [normalizeHeader(b.name), b.id])),
    categoriesByName: new Map(categoriesRes.rows.map((c) => [normalizeHeader(c.name), c.id])),
    seriesByKey: new Map(
      seriesRes.rows.map((s) => [`${s.brand_id}::${s.category_id}::${normalizeHeader(s.name)}`, s.id])
    ),
    productIdBySlug: new Map(productsRes.rows.map((p) => [p.slug, p.id])),
    // lower-cased slug -> stored slug, to catch case-only collisions
    slugByKey: new Map(productsRes.rows.map((p) => [p.slug.toLowerCase(), p.slug])),
    statusBySlug: new Map(productsRes.rows.map((p) => [p.slug, p.availability_status])),
  };
}

// Map of lower-cased ITEM NO -> every row number that uses it (valid-looking
// values only; blanks are reported per row as required-field errors).
function indexSlugRows(entries) {
  const map = new Map();
  for (const { rowNumber, raw } of entries) {
    const value = ((raw && raw.Slug) || "").toString().trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(rowNumber);
  }
  return map;
}

/**
 * Validates + resolves one Excel row against the current DB state.
 * `seenSlugs` is shared across a whole import batch so duplicate Slugs
 * (ITEM NO values) within the same file are caught (only the first
 * occurrence proceeds). `slugRows` (from indexSlugRows) lists every row that
 * uses each ITEM NO so the messages can name them all.
 */
function resolveRow(rowNumber, raw, lookups, seenSlugs, slugRows = new Map()) {
  const errors = [];
  const warnings = [];

  const name = (raw.Name || "").toString().trim();
  const slugInput = (raw.Slug || "").toString().trim();
  const slug = slugInput; // ITEM NO exactly as written — never lower-cased or regenerated
  const slugKey = slug.toLowerCase(); // comparison key only (duplicate / collision checks)
  const brandName = (raw.Brand || "").toString().trim();
  const categoryName = (raw.Category || "").toString().trim();
  const seriesName = (raw.Series || "").toString().trim();
  const model = (raw.Model || "").toString().trim();
  const shortDescription = (raw["Short Description"] || "").toString().trim();
  const description = (raw.Description || "").toString().trim();
  const features = parseListField(raw.Features);
  const specs = parseSpecsField(raw.Specifications);

  if (!name) errors.push("Name is required");

  let slugValid = false;
  if (!slugInput) {
    errors.push("ITEM NO (Slug) is required");
  } else if (slugInput.length > SLUG_MAX_LENGTH) {
    errors.push(`ITEM NO (Slug) is too long (${slugInput.length} characters, maximum ${SLUG_MAX_LENGTH})`);
  } else if (!SLUG_RE.test(slugInput)) {
    errors.push(
      `ITEM NO "${slugInput}" can contain only letters, numbers, and hyphens (it is used as the product URL slug exactly as written, so it is not modified)`
    );
  } else {
    slugValid = true;
    const rowsUsing = slugRows.get(slugKey) || [rowNumber];
    if (seenSlugs.has(slugKey)) {
      errors.push(
        `Duplicate ITEM NO "${slugInput}" in file (first used by row ${seenSlugs.get(slugKey)}; appears in rows ${rowsUsing.join(", ")})`
      );
    } else {
      seenSlugs.set(slugKey, rowNumber);
      const others = rowsUsing.filter((n) => n !== rowNumber);
      if (others.length) {
        warnings.push(`ITEM NO "${slugInput}" is repeated in row(s) ${others.join(", ")} — only this first row will be imported`);
      }
    }
    // An exact match with an existing slug is the normal "update" path. A match
    // that differs only by letter case is a different URL for what is almost
    // certainly the same item, so it is reported instead of silently updating.
    const storedSlug = lookups.slugByKey.get(slugKey);
    if (storedSlug !== undefined && storedSlug !== slugInput) {
      errors.push(
        `ITEM NO "${slugInput}" conflicts with existing product slug "${storedSlug}" (differs only by letter case)`
      );
    }
  }
  if (raw._slugColumn && raw._slugColumn !== slugInput) {
    warnings.push(`The file has both ITEM NO and Slug columns — ITEM NO "${slugInput}" is used, Slug "${raw._slugColumn}" is ignored`);
  }

  let brandId = null;
  if (!brandName) errors.push("Brand is required");
  else {
    brandId = lookups.brandsByName.get(normalizeHeader(brandName)) || null;
    if (!brandId) errors.push(`Brand "${brandName}" was not found`);
  }

  let categoryId = null;
  if (!categoryName) errors.push("Category is required");
  else {
    categoryId = lookups.categoriesByName.get(normalizeHeader(categoryName)) || null;
    if (!categoryId) errors.push(`Category "${categoryName}" was not found`);
  }

  let seriesId = null;
  if (seriesName) {
    if (brandId && categoryId) {
      seriesId = lookups.seriesByKey.get(`${brandId}::${categoryId}::${normalizeHeader(seriesName)}`) || null;
      if (!seriesId) warnings.push(`Series "${seriesName}" was not found for this Brand/Category — left blank`);
    } else {
      warnings.push(`Series "${seriesName}" could not be checked because Brand/Category is invalid`);
    }
  }

  const exists = slugValid && lookups.productIdBySlug.has(slug);

  // ---- availability (only when the file carries the source columns) ----
  const availabilityProvided = raw["In Stock"] !== undefined || raw["Item Status"] !== undefined;
  const availability = {
    provided: availabilityProvided,
    current: null,
    next: null,
    changed: false,
    preserved: false,
    needsReview: false,
    itemStatus: null, // validated values to store (null → leave stored value alone)
    stock: null,
  };
  if (availabilityProvided) {
    const derived = deriveAvailability(raw["In Stock"], raw["Item Status"]);
    availability.current = exists ? lookups.statusBySlug.get(slug) || null : null;
    derived.warnings.forEach((w) => warnings.push(w));
    if (derived.status) {
      if (availability.current === MANUAL_STATUS) {
        availability.next = MANUAL_STATUS; // admin-managed — never overwritten by an import
        availability.preserved = true;
        warnings.push("Status stays Replacement Available (managed manually by an admin)");
      } else {
        availability.next = derived.status;
      }
      availability.changed = availability.next !== availability.current;
      // Source values are only stored when the row's status could be derived.
      availability.itemStatus = derived.itemStatus;
      availability.stock = derived.stock;
    } else {
      availability.needsReview = true;
      const why = derived.problems.join("; ");
      if (exists) {
        warnings.push(`Needs review: ${why}. Availability status left unchanged.`);
      } else {
        errors.push(`Cannot determine availability for a new product: ${why}`);
      }
    }
  }

  const action = errors.length ? "error" : exists ? "update" : "add";

  return {
    rowNumber,
    raw: {
      // same order as the Excel columns (PRODUCT_EXCEL_COLUMNS)
      Slug: slugInput,
      ...(raw._slugColumn ? { _slugColumn: raw._slugColumn } : {}),
      Name: name,
      ...(availabilityProvided ? { "In Stock": (raw["In Stock"] ?? "").toString().trim() } : {}),
      Brand: brandName,
      Category: categoryName,
      Series: seriesName,
      Model: model,
      "Short Description": shortDescription,
      Description: description,
      Features: (raw.Features || "").toString(),
      Specifications: (raw.Specifications || "").toString(),
      ...(availabilityProvided ? { "Item Status": (raw["Item Status"] ?? "").toString().trim() } : {}),
    },
    resolved: {
      name,
      slug,
      brandId,
      categoryId,
      seriesId,
      model,
      shortDescription,
      description,
      features,
      specs,
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
  if (!sheet) return { missingColumns: IMPORT_COLUMNS, rows: [], slugSource: "Slug", availabilityColumns: false };

  const headerMap = {}; // normalized header -> column index
  sheet.getRow(1).eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headerMap[normalizeHeader(cellText(cell.value)).replace(/\s+/g, " ")] = colNumber;
  });

  // ITEM NO (preferred) or Slug supplies the internal Slug field.
  const itemNoKey = ITEM_NO_ALIASES.find((a) => a in headerMap);
  const slugColIdx = itemNoKey ? headerMap[itemNoKey] : headerMap.slug;
  const otherSlugColIdx = itemNoKey && "slug" in headerMap ? headerMap.slug : null;
  const slugSource = itemNoKey ? "ITEM NO" : "Slug";

  const missingColumns = IMPORT_COLUMNS.filter((col) =>
    col === "Slug" ? slugColIdx === undefined : !(normalizeHeader(col) in headerMap)
  ).map((col) => (col === "Slug" ? "Slug (or ITEM NO)" : col));
  if (missingColumns.length) return { missingColumns, rows: [], availabilityColumns: false };

  // Optional availability columns → their column index (if present)
  const availabilityCols = {};
  for (const [col, aliases] of Object.entries(AVAILABILITY_COLUMNS)) {
    const key = aliases.find((a) => a in headerMap);
    if (key) availabilityCols[col] = headerMap[key];
  }

  const rows = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // header row
    const raw = {};
    let hasAny = false;
    for (const col of IMPORT_COLUMNS) {
      const idx = col === "Slug" ? slugColIdx : headerMap[normalizeHeader(col)];
      const val = cellText(row.getCell(idx).value);
      raw[col] = val;
      if (val) hasAny = true;
    }
    if (hasAny) {
      if (otherSlugColIdx) raw._slugColumn = cellText(row.getCell(otherSlugColIdx).value);
      for (const [col, idx] of Object.entries(availabilityCols)) raw[col] = cellText(row.getCell(idx).value);
      rows.push({ rowNumber, raw });
    }
  });

  return { missingColumns: [], rows, slugSource, availabilityColumns: Object.keys(availabilityCols).length > 0 };
}

// ---------------- export ----------------

function columnWidth(header) {
  const widths = {
    Name: 28,
    Slug: 24,
    Brand: 16,
    Category: 18,
    Series: 18,
    Model: 18,
    "Short Description": 32,
    Description: 44,
    Features: 44,
    Specifications: 44,
    "In Stock": 12,
    "Item Status": 14,
  };
  return widths[header] || 20;
}

export async function exportProductsExcel(req, res) {
  try {
    const [productsRes, specsRes] = await Promise.all([
      pool.query(
        `SELECT p.id, p.name, p.slug, p.model, p.short_description, p.description, p.features,
                p.stock_quantity, p.item_status,
                b.name AS brand, c.name AS category, s.name AS series
         FROM products p
         JOIN brands b ON b.id = p.brand_id
         JOIN categories c ON c.id = p.category_id
         LEFT JOIN series s ON s.id = p.series_id
         ORDER BY p.sort_order`
      ),
      pool.query("SELECT product_id, label, value FROM product_specs ORDER BY product_id, sort_order"),
    ]);

    const specsByProduct = new Map();
    for (const s of specsRes.rows) {
      if (!specsByProduct.has(s.product_id)) specsByProduct.set(s.product_id, []);
      specsByProduct.get(s.product_id).push({ label: s.label, value: s.value });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "TRISAK GROUP Admin";
    workbook.created = new Date();
    const sheet = workbook.addWorksheet("Products");
    sheet.columns = PRODUCT_EXCEL_COLUMNS.map((header) => ({
      header,
      key: header,
      width: columnWidth(header),
      // ITEM NO is text: keeps leading zeros when the file is edited and re-imported
      ...(header === "Slug" ? { style: { numFmt: "@" } } : {}),
    }));
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: "frozen", ySplit: 1 }];

    for (const p of productsRes.rows) {
      sheet.addRow({
        Slug: p.slug,
        Name: p.name,
        // blank when never imported — nothing is inferred from the derived status
        "In Stock": p.stock_quantity == null ? "" : Number(p.stock_quantity),
        Brand: p.brand,
        Category: p.category,
        Series: p.series || "",
        Model: p.model || "",
        "Short Description": p.short_description || "",
        Description: p.description || "",
        Features: formatListField(p.features),
        Specifications: formatSpecsField(specsByProduct.get(p.id) || []),
        "Item Status": p.item_status || "",
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

const TEMPLATE_ROWS = 2000; // rows that get the number / dropdown rules

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
      ...(header === "Slug" ? { style: { numFmt: "@" } } : {}), // text: keep leading zeros
    }));
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: "frozen", ySplit: 1 }];

    const col = (header) => PRODUCT_EXCEL_COLUMNS.indexOf(header) + 1;
    for (let r = 2; r <= TEMPLATE_ROWS + 1; r += 1) {
      sheet.getCell(r, col("In Stock")).dataValidation = {
        type: "decimal",
        operator: "greaterThanOrEqual",
        formulae: [0],
        allowBlank: true,
        showErrorMessage: true,
        errorTitle: "In Stock",
        error: "In Stock must be a number of 0 or more.",
      };
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
      ["Slug", "Required. The product's ITEM NO, used exactly as written as the product URL slug (letters, numbers and hyphens only; a column named ITEM NO is also accepted). Must be unique in the file. An existing Slug updates that product; a new Slug creates one."],
      ["Name", "Required."],
      ["In Stock", "Stock quantity: a number, 0 or more."],
      ["Brand / Category", "Required. Must match an existing brand / category name."],
      ["Series / Model", "Optional. Series must exist for that Brand/Category, otherwise it is left blank."],
      ["Short Description / Description", "Optional text."],
      ["Features", 'Separate entries with " | ".'],
      ["Specifications", 'Separate entries with " | "; each entry is "Label: Value".'],
      ["Item Status", "Active or Discontinued."],
      ["Availability status", "Calculated on import (never read from the file): Item Status Discontinued → Discontinued (any stock); Active and In Stock > 0 → Available; Active and In Stock = 0 → Unavailable. Replacement Available and replacement products are managed by admins and are never changed by an import."],
      ["Column order", "Columns are matched by header name, so their order in your file does not matter. In Stock and Item Status are optional columns, but if you include them, fill both."],
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
    const { missingColumns, rows, slugSource, availabilityColumns } = await readWorkbookRows(req.file.buffer);
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
    const seenSlugs = new Map();
    const slugRows = indexSlugRows(rows);
    const results = rows.map(({ rowNumber, raw }) => resolveRow(rowNumber, raw, lookups, seenSlugs, slugRows));

    // ITEM NO values repeated inside the file — surfaced up front, before anything is committed
    const duplicateItemNos = [...slugRows.entries()]
      .filter(([, nums]) => nums.length > 1)
      .map(([key, nums]) => ({
        itemNo: rows.find((r) => r.rowNumber === nums[0]).raw.Slug,
        rows: nums,
        key,
      }))
      .map(({ itemNo, rows: nums }) => ({ itemNo, rows: nums }));

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
    const fromFile = { available: 0, unavailable: 0, discontinued: 0, replacement_available: 0 };
    let needsReview = 0;
    let statusChanges = 0;
    for (const r of results) {
      if (r.availability.needsReview) needsReview += 1;
      if (r.action === "error") continue;
      if (r.availability.next) {
        projected.set(r.resolved.slug, r.availability.next);
        fromFile[r.availability.next] += 1;
        if (r.availability.changed) statusChanges += 1;
      } else if (r.action === "add") {
        projected.set(r.resolved.slug, "available"); // no availability data → default
      }
    }
    const resulting = { available: 0, unavailable: 0, discontinued: 0, replacement_available: 0 };
    for (const status of projected.values()) if (status in resulting) resulting[status] += 1;

    res.json({
      summary,
      slugSource,
      duplicateItemNos,
      rows: results,
      statusSummary: { columnsPresent: availabilityColumns, resulting, fromFile, needsReview, statusChanges },
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
  const errors = [];
  const reviewed = []; // imported rows whose availability was flagged and left unchanged

  const client = await pool.connect();
  try {
    // Re-validate against the DB's current state at commit time (never
    // trust anything the client resolved earlier — brands/categories/
    // other products may have changed since the preview was shown).
    const lookups = await loadLookups();
    const seenSlugs = new Map();
    const slugRows = indexSlugRows(
      items.map((item) => ({ rowNumber: item?.rowNumber, raw: item && typeof item === "object" && item.raw ? item.raw : item }))
    );

    for (const item of items) {
      const raw = item && typeof item === "object" && item.raw ? item.raw : item;
      const rowNumber = item?.rowNumber;
      const { resolved, errors: rowErrors, warnings: rowWarnings, availability } = resolveRow(rowNumber, raw || {}, lookups, seenSlugs, slugRows);

      if (rowErrors.length) {
        skipped += 1;
        errors.push({ rowNumber, slug: raw?.Slug, errors: rowErrors });
        continue;
      }

      const r = resolved;
      try {
        await client.query("BEGIN");
        const existingId = lookups.productIdBySlug.get(r.slug);

        let productId;
        if (existingId) {
          // Only the Excel-managed fields are touched — image_url,
          // product_images, product_documents, related_products,
          // is_new, and sort_order are left exactly as they were.
          await client.query(
            `UPDATE products SET
               name = $1, brand_id = $2, category_id = $3, series_id = $4,
               model = $5, short_description = $6, description = $7, features = $8,
               updated_at = now()
             WHERE id = $9`,
            [
              r.name,
              r.brandId,
              r.categoryId,
              r.seriesId,
              r.model || null,
              r.shortDescription || null,
              r.description || null,
              r.features,
              existingId,
            ]
          );
          await client.query("DELETE FROM product_specs WHERE product_id = $1", [existingId]);
          productId = existingId;
        } else {
          const { rows: maxRows } = await client.query(
            "SELECT COALESCE(MAX(sort_order), 0) + 1 AS n FROM products"
          );
          const insertRes = await client.query(
            `INSERT INTO products
               (name, slug, brand_id, category_id, series_id, model, short_description, description, features, sort_order)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
            [
              r.name,
              r.slug,
              r.brandId,
              r.categoryId,
              r.seriesId,
              r.model || null,
              r.shortDescription || null,
              r.description || null,
              r.features,
              maxRows[0].n,
            ]
          );
          productId = insertRes.rows[0].id;
        }

        // Availability: when the row's source values were valid, store them and
        // the derived status (never the admin-managed Replacement Available,
        // never replacement links). The timestamp moves only on a real change.
        if (availability.provided && availability.next) {
          await client.query(
            `UPDATE products SET
               availability_status = $1,
               status_updated_at = CASE WHEN $2 THEN now() ELSE status_updated_at END,
               item_status = COALESCE($3, item_status),
               stock_quantity = COALESCE($4, stock_quantity)
             WHERE id = $5`,
            [availability.next, availability.changed, availability.itemStatus, availability.stock, productId]
          );
        }

        for (const [i, spec] of r.specs.entries()) {
          await client.query(
            "INSERT INTO product_specs (product_id, label, value, sort_order) VALUES ($1,$2,$3,$4)",
            [productId, spec.label, spec.value, i]
          );
        }

        await client.query("COMMIT");
        lookups.productIdBySlug.set(r.slug, productId); // keep lookups fresh within this batch
        lookups.slugByKey.set(r.slug.toLowerCase(), r.slug);
        if (existingId) updated += 1;
        else added += 1;
        if (availability.provided && availability.next && availability.changed) statusUpdated += 1;
        if (availability.needsReview) reviewed.push({ rowNumber, slug: r.slug, messages: rowWarnings });
      } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        skipped += 1;
        errors.push({ rowNumber, slug: raw?.Slug, errors: [err.message] });
      }
    }

    logActivity(
      "product_import",
      `นำเข้าสินค้าจาก Excel: เพิ่ม ${added}, แก้ไข ${updated}, ข้าม ${skipped}, อัปเดตสถานะ ${statusUpdated}`
    );

    res.json({ added, updated, skipped, errors, statusUpdated, reviewed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Import failed" });
  } finally {
    client.release();
  }
}
