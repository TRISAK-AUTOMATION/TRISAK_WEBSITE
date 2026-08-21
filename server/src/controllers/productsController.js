import pool from "../config/db.js";

export async function listBrands(req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT id, name, slug, logo_url FROM brands WHERE is_active = true ORDER BY sort_order"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load brands" });
  }
}

export async function getBrand(req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT id, name, slug, logo_url FROM brands WHERE slug = $1 AND is_active = true",
      [req.params.brandSlug]
    );
    if (!rows.length) return res.status(404).json({ error: "Brand not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load brand" });
  }
}

export async function listCategories(req, res) {
  try {
    // top-level ("หมวดหมู่ใหญ่") only — subcategories are reached by
    // drilling down from these, not listed flat
    const { rows } = await pool.query(
      "SELECT id, name, slug, image_url FROM categories WHERE is_active = true AND parent_id IS NULL ORDER BY sort_order"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load categories" });
  }
}

// Top-level categories that have products (possibly via a descendant
// subcategory) under a given brand — used to build the Brand page's
// category picker.
export async function listCategoriesForBrand(req, res) {
  try {
    const { rows } = await pool.query(
      `WITH RECURSIVE ancestors AS (
         SELECT id AS leaf_id, id AS current_id, parent_id FROM categories
         UNION ALL
         SELECT a.leaf_id, c.id, c.parent_id
         FROM ancestors a JOIN categories c ON c.id = a.parent_id
       ),
       roots AS (
         SELECT leaf_id, current_id AS root_id FROM ancestors WHERE parent_id IS NULL
       )
       SELECT DISTINCT r.id, r.name, r.slug, r.image_url, r.sort_order
       FROM products p
       JOIN brands b ON b.id = p.brand_id
       JOIN roots ON roots.leaf_id = p.category_id
       JOIN categories r ON r.id = roots.root_id
       WHERE b.slug = $1 AND r.is_active = true AND b.is_active = true
       ORDER BY r.sort_order`,
      [req.params.brandSlug]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load categories for brand" });
  }
}

export async function getCategory(req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT id, name, slug, image_url, parent_id FROM categories WHERE slug = $1 AND is_active = true",
      [req.params.categorySlug]
    );
    if (!rows.length) return res.status(404).json({ error: "Category not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load category" });
  }
}

export async function getCategoryById(req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT id, name, slug, image_url, parent_id FROM categories WHERE id = $1 AND is_active = true",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Category not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load category" });
  }
}

// Direct child categories of :id that have products (possibly via a
// further-nested descendant) under the given brand — powers the
// subcategory drill-down on the Category page.
export async function getCategoryChildren(req, res) {
  const { id } = req.params;
  const { brand } = req.query;
  if (!brand) return res.status(400).json({ error: "brand query param is required" });
  try {
    const { rows } = await pool.query(
      `WITH RECURSIVE descendants AS (
         SELECT id, id AS start_id FROM categories WHERE parent_id = $1
         UNION ALL
         SELECT c.id, d.start_id FROM categories c JOIN descendants d ON c.parent_id = d.id
       )
       SELECT DISTINCT ch.id, ch.name, ch.slug, ch.image_url, ch.sort_order
       FROM categories ch
       JOIN descendants d ON d.start_id = ch.id
       JOIN products p ON p.category_id = d.id
       JOIN brands b ON b.id = p.brand_id
       WHERE ch.parent_id = $1 AND b.slug = $2 AND ch.is_active = true AND b.is_active = true
       ORDER BY ch.sort_order`,
      [id, brand]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load subcategories" });
  }
}

// Ancestor chain from the root category down to :id, for breadcrumbs.
export async function getCategoryBreadcrumb(req, res) {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `WITH RECURSIVE up AS (
         SELECT id, name, slug, parent_id, 0 AS depth FROM categories WHERE id = $1
         UNION ALL
         SELECT c.id, c.name, c.slug, c.parent_id, u.depth + 1
         FROM categories c JOIN up u ON c.id = u.parent_id
       )
       SELECT id, name, slug FROM up ORDER BY depth DESC`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load category breadcrumb" });
  }
}

export async function listSeries(req, res) {
  const { brand, category, categoryId } = req.query;
  const conditions = ["s.is_active = true"];
  const values = [];

  let query = `
    SELECT s.id, s.name, s.slug, s.tagline, s.description, s.image_url, s.is_new,
           b.slug AS brand_slug, b.name AS brand_name,
           c.id AS category_id, c.slug AS category_slug, c.name AS category_name,
           (SELECT COUNT(*) FROM products p WHERE p.series_id = s.id) AS product_count
    FROM series s
    JOIN brands b ON b.id = s.brand_id
    JOIN categories c ON c.id = s.category_id
  `;

  if (brand) {
    values.push(brand);
    conditions.push(`b.slug = $${values.length}`);
  }
  if (categoryId) {
    values.push(categoryId);
    conditions.push(`c.id = $${values.length}`);
  } else if (category) {
    values.push(category);
    conditions.push(`c.slug = $${values.length}`);
  }
  query += " WHERE " + conditions.join(" AND ");
  query += " ORDER BY s.sort_order";

  try {
    const { rows } = await pool.query(query, values);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load series" });
  }
}

export async function getSeries(req, res) {
  const { brandSlug, categorySlug, seriesSlug } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT s.id, s.name, s.slug, s.tagline, s.description, s.image_url, s.is_new,
              b.slug AS brand_slug, b.name AS brand_name,
              c.slug AS category_slug, c.name AS category_name
       FROM series s
       JOIN brands b ON b.id = s.brand_id
       JOIN categories c ON c.id = s.category_id
       WHERE b.slug = $1 AND c.slug = $2 AND s.slug = $3 AND s.is_active = true`,
      [brandSlug, categorySlug, seriesSlug]
    );
    if (!rows.length) return res.status(404).json({ error: "Series not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load series" });
  }
}

const PRODUCT_LIST_SELECT = `
  SELECT p.id, p.name, p.slug, p.model, p.short_description, p.image_url, p.is_new,
         b.name AS brand, b.slug AS brand_slug,
         c.name AS category, c.slug AS category_slug,
         s.name AS series, s.slug AS series_slug
  FROM products p
  JOIN brands b ON b.id = p.brand_id
  JOIN categories c ON c.id = p.category_id
  LEFT JOIN series s ON s.id = p.series_id
`;

export async function listProducts(req, res) {
  const { brand, category, categoryId, series, q } = req.query;
  const conditions = ["b.is_active = true", "c.is_active = true", "(s.id IS NULL OR s.is_active = true)"];
  const values = [];
  let query = PRODUCT_LIST_SELECT;

  if (brand) {
    values.push(brand);
    conditions.push(`b.slug = $${values.length}`);
  }
  if (categoryId) {
    values.push(categoryId);
    conditions.push(`c.id = $${values.length}`);
  } else if (category) {
    values.push(category);
    conditions.push(`c.slug = $${values.length}`);
  }
  if (series) {
    values.push(series);
    conditions.push(`s.slug = $${values.length}`);
  }
  if (q) {
    values.push(`%${q}%`);
    conditions.push(`(p.name ILIKE $${values.length} OR p.model ILIKE $${values.length})`);
  }
  query += " WHERE " + conditions.join(" AND ");
  query += " ORDER BY p.sort_order, p.name";

  try {
    const { rows } = await pool.query(query, values);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load products" });
  }
}

export async function getFeaturedProducts(req, res) {
  try {
    const { rows } = await pool.query(
      `${PRODUCT_LIST_SELECT}
       WHERE b.is_active = true AND c.is_active = true AND (s.id IS NULL OR s.is_active = true)
       ORDER BY p.is_new DESC, p.sort_order LIMIT 8`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load featured products" });
  }
}

// Full product detail page: product + images + specs + documents + related products
export async function getProductBySlug(req, res) {
  const { slug } = req.params;
  try {
    const productRes = await pool.query(
      `SELECT p.*, b.name AS brand, b.slug AS brand_slug,
              c.name AS category, c.slug AS category_slug,
              s.name AS series, s.slug AS series_slug
       FROM products p
       JOIN brands b ON b.id = p.brand_id
       JOIN categories c ON c.id = p.category_id
       LEFT JOIN series s ON s.id = p.series_id
       WHERE p.slug = $1`,
      [slug]
    );
    if (!productRes.rows.length) {
      return res.status(404).json({ error: "Product not found" });
    }
    const product = productRes.rows[0];

    const [images, specs, documents, related] = await Promise.all([
      pool.query(
        "SELECT id, image_url, sort_order FROM product_images WHERE product_id = $1 ORDER BY sort_order",
        [product.id]
      ),
      pool.query(
        "SELECT id, label, value, sort_order FROM product_specs WHERE product_id = $1 ORDER BY sort_order",
        [product.id]
      ),
      pool.query(
        "SELECT id, label, file_url, doc_type, sort_order FROM product_documents WHERE product_id = $1 ORDER BY sort_order",
        [product.id]
      ),
      pool.query(
        `SELECT p.id, p.name, p.slug, p.model, p.image_url,
                s.slug AS series_slug, b.slug AS brand_slug, c.slug AS category_slug
         FROM related_products rp
         JOIN products p ON p.id = rp.related_product_id
         LEFT JOIN series s ON s.id = p.series_id
         JOIN brands b ON b.id = p.brand_id
         JOIN categories c ON c.id = p.category_id
         WHERE rp.product_id = $1`,
        [product.id]
      ),
    ]);

    res.json({
      ...product,
      images: images.rows,
      specs: specs.rows,
      documents: documents.rows,
      relatedProducts: related.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load product" });
  }
}

export async function listSolutions(req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT id, name, slug, summary, services, benefits FROM solutions ORDER BY sort_order"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load solutions" });
  }
}

export async function listIndustries(req, res) {
  try {
    const { rows } = await pool.query("SELECT id, name FROM industries ORDER BY sort_order");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load industries" });
  }
}
