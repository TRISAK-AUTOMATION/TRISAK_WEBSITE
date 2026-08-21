import pool from "../config/db.js";
import { createSession, destroySession } from "../middleware/adminAuth.js";

// ---------------- auth ----------------

export async function login(req, res) {
  const { password } = req.body || {};
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid password" });
  }
  const token = createSession();
  res.json({ token });
}

export async function logout(req, res) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) destroySession(token);
  res.json({ success: true });
}

// ---------------- taxonomy (brand / category / series) ----------------
// Full CRUD + status toggle + reorder, to back the dedicated admin list
// and edit pages for each entity.

async function reorderRow(table, id, direction, scopeColumns = []) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const currentRes = await client.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
    if (!currentRes.rows.length) {
      await client.query("ROLLBACK");
      return "not-found";
    }
    const current = currentRes.rows[0];
    const cmp = direction === "up" ? "<" : ">";
    const order = direction === "up" ? "DESC" : "ASC";
    // IS NOT DISTINCT FROM (rather than =) so a NULL scope value (e.g. a
    // top-level category with parent_id = NULL) still matches correctly —
    // plain "=" never matches NULL in SQL.
    const scopeConds = scopeColumns
      .map((col, i) => `${col} IS NOT DISTINCT FROM $${i + 2}`)
      .join(" AND ");
    const scopeVals = scopeColumns.map((col) => current[col]);
    const scopeSql = scopeConds ? ` AND ${scopeConds}` : "";
    const neighborRes = await client.query(
      `SELECT id, sort_order FROM ${table} WHERE sort_order ${cmp} $1${scopeSql} ORDER BY sort_order ${order} LIMIT 1`,
      [current.sort_order, ...scopeVals]
    );
    if (!neighborRes.rows.length) {
      await client.query("ROLLBACK");
      return "edge"; // already first/last within its scope — nothing to swap with
    }
    const neighbor = neighborRes.rows[0];
    await client.query(`UPDATE ${table} SET sort_order = $1, updated_at = now() WHERE id = $2`, [
      neighbor.sort_order,
      current.id,
    ]);
    await client.query(`UPDATE ${table} SET sort_order = $1, updated_at = now() WHERE id = $2`, [
      current.sort_order,
      neighbor.id,
    ]);
    await client.query("COMMIT");
    return "ok";
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

function parseDirection(req, res) {
  const { direction } = req.body || {};
  if (direction !== "up" && direction !== "down") {
    res.status(400).json({ error: "direction must be 'up' or 'down'" });
    return null;
  }
  return direction;
}

// ---- brands ----

export async function listBrandsAdmin(req, res) {
  try {
    const { rows } = await pool.query("SELECT * FROM brands ORDER BY sort_order");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load brands" });
  }
}

export async function getBrandAdmin(req, res) {
  try {
    const { rows } = await pool.query("SELECT * FROM brands WHERE id = $1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Brand not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load brand" });
  }
}

export async function createBrand(req, res) {
  const { name, slug, logoUrl, isActive = true, sortOrder = 0 } = req.body || {};
  if (!name || !slug) return res.status(400).json({ error: "name and slug are required" });
  try {
    const { rows } = await pool.query(
      "INSERT INTO brands (name, slug, logo_url, is_active, sort_order) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [name, slug, logoUrl || null, isActive, sortOrder]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function updateBrand(req, res) {
  const { id } = req.params;
  const { name, slug, logoUrl, isActive = true, sortOrder = 0 } = req.body || {};
  if (!name || !slug) return res.status(400).json({ error: "name and slug are required" });
  try {
    const { rows } = await pool.query(
      "UPDATE brands SET name = $1, slug = $2, logo_url = $3, is_active = $4, sort_order = $5, updated_at = now() WHERE id = $6 RETURNING *",
      [name, slug, logoUrl || null, isActive, sortOrder, id]
    );
    if (!rows.length) return res.status(404).json({ error: "Brand not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function toggleBrandStatus(req, res) {
  const { isActive } = req.body || {};
  if (typeof isActive !== "boolean") {
    return res.status(400).json({ error: "isActive (boolean) is required" });
  }
  try {
    const { rows } = await pool.query(
      "UPDATE brands SET is_active = $1, updated_at = now() WHERE id = $2 RETURNING id, is_active",
      [isActive, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Brand not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update brand status" });
  }
}

export async function reorderBrand(req, res) {
  const direction = parseDirection(req, res);
  if (!direction) return;
  try {
    const result = await reorderRow("brands", req.params.id, direction, []);
    if (result === "not-found") return res.status(404).json({ error: "Brand not found" });
    res.json({ success: true, moved: result === "ok" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteBrand(req, res) {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      "SELECT COUNT(*)::int AS count FROM products WHERE brand_id = $1",
      [id]
    );
    if (rows[0].count > 0) {
      return res.status(409).json({
        error: `Can't delete — ${rows[0].count} product(s) still use this brand. Reassign or delete them first.`,
      });
    }
    const result = await pool.query("DELETE FROM brands WHERE id = $1", [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Brand not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// ---- categories ----

export async function listCategoriesAdmin(req, res) {
  try {
    const { rows } = await pool.query("SELECT * FROM categories ORDER BY sort_order");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load categories" });
  }
}

export async function getCategoryAdmin(req, res) {
  try {
    const { rows } = await pool.query("SELECT * FROM categories WHERE id = $1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Category not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load category" });
  }
}

// Recursively collect every descendant id of a category (used to stop a
// category being set as its own descendant's parent, which would create
// a cycle in the tree).
async function getDescendantIds(categoryId) {
  const { rows } = await pool.query(
    `WITH RECURSIVE descendants AS (
       SELECT id FROM categories WHERE parent_id = $1
       UNION ALL
       SELECT c.id FROM categories c JOIN descendants d ON c.parent_id = d.id
     )
     SELECT id FROM descendants`,
    [categoryId]
  );
  return rows.map((r) => r.id);
}

export async function createCategory(req, res) {
  const { name, slug, imageUrl, parentId, isActive = true, sortOrder = 0 } = req.body || {};
  if (!name || !slug) return res.status(400).json({ error: "name and slug are required" });
  try {
    const { rows } = await pool.query(
      "INSERT INTO categories (name, slug, image_url, parent_id, is_active, sort_order) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [name, slug, imageUrl || null, parentId || null, isActive, sortOrder]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function updateCategory(req, res) {
  const { id } = req.params;
  const { name, slug, imageUrl, parentId, isActive = true, sortOrder = 0 } = req.body || {};
  if (!name || !slug) return res.status(400).json({ error: "name and slug are required" });

  try {
    if (parentId) {
      if (Number(parentId) === Number(id)) {
        return res.status(400).json({ error: "A category can't be its own parent" });
      }
      const descendantIds = await getDescendantIds(id);
      if (descendantIds.includes(Number(parentId))) {
        return res
          .status(400)
          .json({ error: "Can't set a subcategory of this category as its parent (would create a loop)" });
      }
    }

    const { rows } = await pool.query(
      "UPDATE categories SET name = $1, slug = $2, image_url = $3, parent_id = $4, is_active = $5, sort_order = $6, updated_at = now() WHERE id = $7 RETURNING *",
      [name, slug, imageUrl || null, parentId || null, isActive, sortOrder, id]
    );
    if (!rows.length) return res.status(404).json({ error: "Category not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function toggleCategoryStatus(req, res) {
  const { isActive } = req.body || {};
  if (typeof isActive !== "boolean") {
    return res.status(400).json({ error: "isActive (boolean) is required" });
  }
  try {
    const { rows } = await pool.query(
      "UPDATE categories SET is_active = $1, updated_at = now() WHERE id = $2 RETURNING id, is_active",
      [isActive, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Category not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update category status" });
  }
}

export async function reorderCategory(req, res) {
  const direction = parseDirection(req, res);
  if (!direction) return;
  try {
    // scoped to siblings under the same parent (including other
    // top-level categories, where parent_id is NULL for all of them)
    const result = await reorderRow("categories", req.params.id, direction, ["parent_id"]);
    if (result === "not-found") return res.status(404).json({ error: "Category not found" });
    res.json({ success: true, moved: result === "ok" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteCategory(req, res) {
  const { id } = req.params;
  try {
    const [productCount, childCount] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS count FROM products WHERE category_id = $1", [id]),
      pool.query("SELECT COUNT(*)::int AS count FROM categories WHERE parent_id = $1", [id]),
    ]);
    if (productCount.rows[0].count > 0) {
      return res.status(409).json({
        error: `Can't delete — ${productCount.rows[0].count} product(s) still use this category. Reassign or delete them first.`,
      });
    }
    if (childCount.rows[0].count > 0) {
      return res.status(409).json({
        error: `Can't delete — ${childCount.rows[0].count} subcategory(ies) are still under this category. Delete or move them first.`,
      });
    }
    const result = await pool.query("DELETE FROM categories WHERE id = $1", [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Category not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// ---- series ----

export async function listSeriesAdmin(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT s.*, b.name AS brand_name, c.name AS category_name
       FROM series s
       JOIN brands b ON b.id = s.brand_id
       JOIN categories c ON c.id = s.category_id
       ORDER BY s.sort_order`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load series" });
  }
}

export async function getSeriesAdmin(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT s.*, b.name AS brand_name, c.name AS category_name
       FROM series s
       JOIN brands b ON b.id = s.brand_id
       JOIN categories c ON c.id = s.category_id
       WHERE s.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Series not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load series" });
  }
}

export async function createSeries(req, res) {
  const {
    name,
    slug,
    brandId,
    categoryId,
    tagline,
    description,
    imageUrl,
    isNew = false,
    isActive = true,
    sortOrder = 0,
  } = req.body || {};
  if (!name || !slug || !brandId || !categoryId) {
    return res.status(400).json({ error: "name, slug, brandId, categoryId are required" });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO series
        (name, slug, brand_id, category_id, tagline, description, image_url, is_new, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        name,
        slug,
        brandId,
        categoryId,
        tagline || null,
        description || null,
        imageUrl || null,
        isNew,
        isActive,
        sortOrder,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function updateSeries(req, res) {
  const { id } = req.params;
  const {
    name,
    slug,
    brandId,
    categoryId,
    tagline,
    description,
    imageUrl,
    isNew = false,
    isActive = true,
    sortOrder = 0,
  } = req.body || {};
  if (!name || !slug || !brandId || !categoryId) {
    return res.status(400).json({ error: "name, slug, brandId, categoryId are required" });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE series SET
        name = $1, slug = $2, brand_id = $3, category_id = $4,
        tagline = $5, description = $6, image_url = $7, is_new = $8, is_active = $9, sort_order = $10,
        updated_at = now()
       WHERE id = $11 RETURNING *`,
      [
        name,
        slug,
        brandId,
        categoryId,
        tagline || null,
        description || null,
        imageUrl || null,
        isNew,
        isActive,
        sortOrder,
        id,
      ]
    );
    if (!rows.length) return res.status(404).json({ error: "Series not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function toggleSeriesStatus(req, res) {
  const { isActive } = req.body || {};
  if (typeof isActive !== "boolean") {
    return res.status(400).json({ error: "isActive (boolean) is required" });
  }
  try {
    const { rows } = await pool.query(
      "UPDATE series SET is_active = $1, updated_at = now() WHERE id = $2 RETURNING id, is_active",
      [isActive, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Series not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update series status" });
  }
}

export async function reorderSeries(req, res) {
  const direction = parseDirection(req, res);
  if (!direction) return;
  try {
    const result = await reorderRow("series", req.params.id, direction, ["brand_id", "category_id"]);
    if (result === "not-found") return res.status(404).json({ error: "Series not found" });
    res.json({ success: true, moved: result === "ok" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteSeries(req, res) {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      "SELECT COUNT(*)::int AS count FROM products WHERE series_id = $1",
      [id]
    );
    if (rows[0].count > 0) {
      return res.status(409).json({
        error: `Can't delete — ${rows[0].count} product(s) still use this series. Reassign or delete them first.`,
      });
    }
    const result = await pool.query("DELETE FROM series WHERE id = $1", [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Series not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// ---------------- image upload ----------------

export async function uploadImage(req, res) {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.status(201).json({ url, filename: req.file.filename });
}

// ---------------- products ----------------

export async function listProductsAdmin(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.name, p.slug, p.model, p.image_url, p.is_new, p.updated_at,
              b.name AS brand, c.name AS category, s.name AS series
       FROM products p
       JOIN brands b ON b.id = p.brand_id
       JOIN categories c ON c.id = p.category_id
       LEFT JOIN series s ON s.id = p.series_id
       ORDER BY p.updated_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load products" });
  }
}

export async function getProductAdmin(req, res) {
  const { id } = req.params;
  try {
    const productRes = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
    if (!productRes.rows.length) return res.status(404).json({ error: "Product not found" });
    const product = productRes.rows[0];

    const [images, specs, documents, related] = await Promise.all([
      pool.query(
        "SELECT id, image_url, sort_order FROM product_images WHERE product_id = $1 ORDER BY sort_order",
        [id]
      ),
      pool.query(
        "SELECT id, label, value, sort_order FROM product_specs WHERE product_id = $1 ORDER BY sort_order",
        [id]
      ),
      pool.query(
        "SELECT id, label, file_url, doc_type, sort_order FROM product_documents WHERE product_id = $1 ORDER BY sort_order",
        [id]
      ),
      pool.query("SELECT related_product_id FROM related_products WHERE product_id = $1", [id]),
    ]);

    res.json({
      ...product,
      images: images.rows,
      specs: specs.rows,
      documents: documents.rows,
      relatedProductIds: related.rows.map((r) => r.related_product_id),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load product" });
  }
}

/**
 * Create/update payload shape:
 * {
 *   name, slug, brandId, categoryId, seriesId, model,
 *   shortDescription, description, features: string[], imageUrl,
 *   isNew, sortOrder,
 *   images: [{ imageUrl, sortOrder }],
 *   specs: [{ label, value, sortOrder }],
 *   documents: [{ label, fileUrl, docType, sortOrder }],
 *   relatedProductIds: number[],
 * }
 */
function validateProductPayload(body) {
  const { name, slug, brandId, categoryId } = body || {};
  if (!name || !slug || !brandId || !categoryId) {
    return "name, slug, brandId, and categoryId are required";
  }
  return null;
}

async function replaceProductChildren(client, productId, body) {
  await client.query("DELETE FROM product_images WHERE product_id = $1", [productId]);
  await client.query("DELETE FROM product_specs WHERE product_id = $1", [productId]);
  await client.query("DELETE FROM product_documents WHERE product_id = $1", [productId]);
  await client.query(
    "DELETE FROM related_products WHERE product_id = $1 OR related_product_id = $1",
    [productId]
  );

  for (const img of body.images || []) {
    if (!img.imageUrl) continue;
    await client.query(
      "INSERT INTO product_images (product_id, image_url, sort_order) VALUES ($1, $2, $3)",
      [productId, img.imageUrl, img.sortOrder || 0]
    );
  }
  for (const spec of body.specs || []) {
    if (!spec.label || !spec.value) continue;
    await client.query(
      "INSERT INTO product_specs (product_id, label, value, sort_order) VALUES ($1, $2, $3, $4)",
      [productId, spec.label, spec.value, spec.sortOrder || 0]
    );
  }
  for (const doc of body.documents || []) {
    if (!doc.label || !doc.fileUrl) continue;
    await client.query(
      "INSERT INTO product_documents (product_id, label, file_url, doc_type, sort_order) VALUES ($1, $2, $3, $4, $5)",
      [productId, doc.label, doc.fileUrl, doc.docType || "pdf", doc.sortOrder || 0]
    );
  }
  for (const relatedId of body.relatedProductIds || []) {
    if (Number(relatedId) === Number(productId)) continue; // no self-reference
    await client.query(
      "INSERT INTO related_products (product_id, related_product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [productId, relatedId]
    );
  }
}

export async function createProduct(req, res) {
  const body = req.body || {};
  const validationError = validateProductPayload(body);
  if (validationError) return res.status(400).json({ error: validationError });

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO products
        (name, slug, brand_id, category_id, series_id, model, short_description, description, features, image_url, is_new, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id`,
      [
        body.name,
        body.slug,
        body.brandId,
        body.categoryId,
        body.seriesId || null,
        body.model || null,
        body.shortDescription || null,
        body.description || null,
        body.features || [],
        body.imageUrl || null,
        body.isNew || false,
        body.sortOrder || 0,
      ]
    );
    const productId = rows[0].id;
    await replaceProductChildren(client, productId, body);
    await client.query("COMMIT");
    res.status(201).json({ id: productId });
  } catch (err) {
    if (client) await client.query("ROLLBACK");
    console.error(err);
    res.status(400).json({ error: err.message });
  } finally {
    if (client) client.release();
  }
}

export async function updateProduct(req, res) {
  const { id } = req.params;
  const body = req.body || {};
  const validationError = validateProductPayload(body);
  if (validationError) return res.status(400).json({ error: validationError });

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE products SET
        name = $1, slug = $2, brand_id = $3, category_id = $4, series_id = $5,
        model = $6, short_description = $7, description = $8, features = $9,
        image_url = $10, is_new = $11, sort_order = $12, updated_at = now()
       WHERE id = $13`,
      [
        body.name,
        body.slug,
        body.brandId,
        body.categoryId,
        body.seriesId || null,
        body.model || null,
        body.shortDescription || null,
        body.description || null,
        body.features || [],
        body.imageUrl || null,
        body.isNew || false,
        body.sortOrder || 0,
        id,
      ]
    );
    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Product not found" });
    }
    await replaceProductChildren(client, id, body);
    await client.query("COMMIT");
    res.json({ success: true });
  } catch (err) {
    if (client) await client.query("ROLLBACK");
    console.error(err);
    res.status(400).json({ error: err.message });
  } finally {
    if (client) client.release();
  }
}

export async function deleteProduct(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM products WHERE id = $1", [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Product not found" });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete product" });
  }
}
