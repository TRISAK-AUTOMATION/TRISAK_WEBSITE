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
    const { rows } = await pool.query(
      "SELECT id, name, slug, image_url FROM categories WHERE is_active = true ORDER BY sort_order"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load categories" });
  }
}

// Categories that actually have products under a given brand — used to
// build the pill/tab list on the Brand page.
export async function listCategoriesForBrand(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT c.id, c.name, c.slug, c.image_url, c.sort_order
       FROM categories c
       JOIN products p ON p.category_id = c.id
       JOIN brands b ON b.id = p.brand_id
       WHERE b.slug = $1 AND c.is_active = true AND b.is_active = true
       ORDER BY c.sort_order`,
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
      "SELECT id, name, slug, image_url FROM categories WHERE slug = $1 AND is_active = true",
      [req.params.categorySlug]
    );
    if (!rows.length) return res.status(404).json({ error: "Category not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load category" });
  }
}

export async function listSeries(req, res) {
  const { brand, category } = req.query;
  const conditions = ["s.is_active = true"];
  const values = [];

  let query = `
    SELECT s.id, s.name, s.slug, s.tagline, s.description, s.image_url, s.is_new,
           b.slug AS brand_slug, b.name AS brand_name,
           c.slug AS category_slug, c.name AS category_name,
           (SELECT COUNT(*) FROM products p WHERE p.series_id = s.id) AS product_count
    FROM series s
    JOIN brands b ON b.id = s.brand_id
    JOIN categories c ON c.id = s.category_id
  `;

  if (brand) {
    values.push(brand);
    conditions.push(`b.slug = $${values.length}`);
  }
  if (category) {
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
  const { brand, category, series, q } = req.query;
  const conditions = ["b.is_active = true", "c.is_active = true", "(s.id IS NULL OR s.is_active = true)"];
  const values = [];
  let query = PRODUCT_LIST_SELECT;

  if (brand) {
    values.push(brand);
    conditions.push(`b.slug = $${values.length}`);
  }
  if (category) {
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
