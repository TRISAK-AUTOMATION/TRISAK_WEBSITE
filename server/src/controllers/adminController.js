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
// Lightweight CRUD so the admin isn't stuck if they need a new brand,
// category, or series before they can add a product under it.

export async function listBrandsAdmin(req, res) {
  const { rows } = await pool.query("SELECT * FROM brands ORDER BY sort_order");
  res.json(rows);
}

export async function createBrand(req, res) {
  const { name, slug, sortOrder = 0 } = req.body || {};
  if (!name || !slug) return res.status(400).json({ error: "name and slug are required" });
  try {
    const { rows } = await pool.query(
      "INSERT INTO brands (name, slug, sort_order) VALUES ($1, $2, $3) RETURNING *",
      [name, slug, sortOrder]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function updateBrand(req, res) {
  const { id } = req.params;
  const { name, slug, sortOrder = 0 } = req.body || {};
  if (!name || !slug) return res.status(400).json({ error: "name and slug are required" });
  try {
    const { rows } = await pool.query(
      "UPDATE brands SET name = $1, slug = $2, sort_order = $3 WHERE id = $4 RETURNING *",
      [name, slug, sortOrder, id]
    );
    if (!rows.length) return res.status(404).json({ error: "Brand not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
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

export async function listCategoriesAdmin(req, res) {
  const { rows } = await pool.query("SELECT * FROM categories ORDER BY sort_order");
  res.json(rows);
}

export async function createCategory(req, res) {
  const { name, slug, sortOrder = 0 } = req.body || {};
  if (!name || !slug) return res.status(400).json({ error: "name and slug are required" });
  try {
    const { rows } = await pool.query(
      "INSERT INTO categories (name, slug, sort_order) VALUES ($1, $2, $3) RETURNING *",
      [name, slug, sortOrder]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function updateCategory(req, res) {
  const { id } = req.params;
  const { name, slug, sortOrder = 0 } = req.body || {};
  if (!name || !slug) return res.status(400).json({ error: "name and slug are required" });
  try {
    const { rows } = await pool.query(
      "UPDATE categories SET name = $1, slug = $2, sort_order = $3 WHERE id = $4 RETURNING *",
      [name, slug, sortOrder, id]
    );
    if (!rows.length) return res.status(404).json({ error: "Category not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteCategory(req, res) {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      "SELECT COUNT(*)::int AS count FROM products WHERE category_id = $1",
      [id]
    );
    if (rows[0].count > 0) {
      return res.status(409).json({
        error: `Can't delete — ${rows[0].count} product(s) still use this category. Reassign or delete them first.`,
      });
    }
    const result = await pool.query("DELETE FROM categories WHERE id = $1", [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Category not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function listSeriesAdmin(req, res) {
  const { rows } = await pool.query(
    `SELECT s.*, b.name AS brand_name, c.name AS category_name
     FROM series s
     JOIN brands b ON b.id = s.brand_id
     JOIN categories c ON c.id = s.category_id
     ORDER BY s.sort_order`
  );
  res.json(rows);
}

export async function createSeries(req, res) {
  const { name, slug, brandId, categoryId, tagline, description, sortOrder = 0, isNew = false } =
    req.body || {};
  if (!name || !slug || !brandId || !categoryId) {
    return res.status(400).json({ error: "name, slug, brandId, categoryId are required" });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO series (name, slug, brand_id, category_id, tagline, description, sort_order, is_new)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, slug, brandId, categoryId, tagline || null, description || null, sortOrder, isNew]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function updateSeries(req, res) {
  const { id } = req.params;
  const { name, slug, brandId, categoryId, tagline, description, sortOrder = 0, isNew = false } =
    req.body || {};
  if (!name || !slug || !brandId || !categoryId) {
    return res.status(400).json({ error: "name, slug, brandId, categoryId are required" });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE series SET
        name = $1, slug = $2, brand_id = $3, category_id = $4,
        tagline = $5, description = $6, sort_order = $7, is_new = $8
       WHERE id = $9 RETURNING *`,
      [name, slug, brandId, categoryId, tagline || null, description || null, sortOrder, isNew, id]
    );
    if (!rows.length) return res.status(404).json({ error: "Series not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
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

  const client = await pool.connect();
  try {
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
    await client.query("ROLLBACK");
    console.error(err);
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
}

export async function updateProduct(req, res) {
  const { id } = req.params;
  const body = req.body || {};
  const validationError = validateProductPayload(body);
  if (validationError) return res.status(400).json({ error: validationError });

  const client = await pool.connect();
  try {
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
    await client.query("ROLLBACK");
    console.error(err);
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
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
