import pool from "../config/db.js";

/**
 * Products guide (public): the main series, grouped by product type.
 *
 * A product type is a top-level category; a series belongs to it when the
 * series' own category is that category or anything below it. Only active
 * series of active brands are shown; a type appears once it has a series.
 *
 *   GET /api/guide                                  types → series cards, brands
 *   GET /api/guide/series/:typeSlug/:seriesSlug     one series in full + related
 *   GET /api/guide/resolve?path=/products/...       where an old catalog URL lives now
 */

// category id -> its top-level ancestor (the product type)
const ROOTS_CTE = `
  WITH RECURSIVE roots AS (
    SELECT id, id AS root_id FROM categories WHERE parent_id IS NULL
    UNION ALL
    SELECT c.id, r.root_id FROM categories c JOIN roots r ON c.parent_id = r.id
  )`;

const CARD_COLUMNS = `
  s.id, s.name, s.slug, s.tagline, s.tagline_th, s.image_url, s.is_new, s.is_legacy,
  s.key_specs, s.sort_order,
  b.name AS brand, b.slug AS brand_slug, b.logo_url AS brand_logo,
  t.id AS type_id, t.slug AS type_slug`;

export async function getGuide(req, res) {
  try {
    const [{ rows: series }, { rows: types }, { rows: brands }] = await Promise.all([
      pool.query(
        `${ROOTS_CTE}
         SELECT ${CARD_COLUMNS}
         FROM series s
         JOIN brands b ON b.id = s.brand_id AND b.is_active
         JOIN roots r ON r.id = s.category_id
         JOIN categories t ON t.id = r.root_id
         WHERE s.is_active
         ORDER BY s.is_legacy, s.sort_order, s.name`
      ),
      pool.query(
        `SELECT id, name, name_th, slug, summary_en, summary_th, icon_key, image_url, sort_order
         FROM categories WHERE parent_id IS NULL AND is_active ORDER BY sort_order, name`
      ),
      pool.query("SELECT name, slug, logo_url FROM brands WHERE is_active ORDER BY sort_order"),
    ]);
    const byType = new Map(types.map((t) => [t.id, { ...t, series: [] }]));
    for (const s of series) {
      const card = { ...s, key_specs: (s.key_specs || []).slice(0, 3) };
      byType.get(s.type_id)?.series.push(card);
    }
    res.json({
      types: [...byType.values()].filter((t) => t.series.length),
      brands,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load the products guide" });
  }
}

export async function getGuideSeries(req, res) {
  const { typeSlug, seriesSlug } = req.params;
  try {
    const { rows } = await pool.query(
      `${ROOTS_CTE}
       SELECT s.*, b.name AS brand, b.slug AS brand_slug, b.logo_url AS brand_logo,
              t.id AS type_id, t.slug AS type_slug, t.name AS type_name, t.name_th AS type_name_th,
              c.name AS category_name
       FROM series s
       JOIN brands b ON b.id = s.brand_id AND b.is_active
       JOIN categories c ON c.id = s.category_id
       JOIN roots r ON r.id = s.category_id
       JOIN categories t ON t.id = r.root_id
       WHERE s.is_active AND t.slug = $1 AND s.slug = $2
       ORDER BY s.sort_order
       LIMIT 1`,
      [typeSlug, seriesSlug]
    );
    const series = rows[0];
    if (!series) return res.status(404).json({ error: "Series not found" });

    const [{ rows: related }, { rows: successor }] = await Promise.all([
      pool.query(
        `${ROOTS_CTE}
         SELECT ${CARD_COLUMNS}
         FROM series s
         JOIN brands b ON b.id = s.brand_id AND b.is_active
         JOIN roots r ON r.id = s.category_id
         JOIN categories t ON t.id = r.root_id
         WHERE s.is_active AND t.id = $1 AND s.id <> $2
         ORDER BY s.is_legacy, s.sort_order, s.name
         LIMIT 6`,
        [series.type_id, series.id]
      ),
      series.replaced_by_id
        ? pool.query(
            `${ROOTS_CTE}
             SELECT s.name, s.slug, t.slug AS type_slug
             FROM series s
             JOIN roots r ON r.id = s.category_id
             JOIN categories t ON t.id = r.root_id
             WHERE s.id = $1 AND s.is_active`,
            [series.replaced_by_id]
          )
        : { rows: [] },
    ]);
    res.json({
      ...series,
      related: related.map((s) => ({ ...s, key_specs: (s.key_specs || []).slice(0, 3) })),
      replaced_by: successor[0] || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load the series" });
  }
}

/**
 * Maps an old catalog URL to its place in the guide, so bookmarks and search
 * results keep working:
 *   /products/:brand                       → /products?brand=:brand
 *   /products/:brand/:category[/cat/...]   → /products/:type (the category's type)
 *   /products/:brand/:category/:slug       → the series page (an old series URL,
 *                                            or a product's series), else its type
 *   /products/latest                       → /products
 */
export async function resolveGuidePath(req, res) {
  const parts = String(req.query.path || "")
    .split("?")[0]
    .split("/")
    .filter(Boolean)
    .map((p) => decodeURIComponent(p));
  if (parts[0] === "products") parts.shift();
  const [first, second, third] = parts;
  const home = { to: "/products" };
  try {
    if (!first || first === "latest") return res.json(home);

    const brand = (await pool.query("SELECT slug FROM brands WHERE slug = $1", [first])).rows[0];
    if (!brand) return res.json(home);
    if (!second) return res.json({ to: `/products?brand=${encodeURIComponent(brand.slug)}` });

    const typeOf = async (categorySlug) =>
      (
        await pool.query(
          `${ROOTS_CTE}
           SELECT t.slug FROM categories c
           JOIN roots r ON r.id = c.id
           JOIN categories t ON t.id = r.root_id
           WHERE c.slug = $1`,
          [categorySlug]
        )
      ).rows[0]?.slug;

    const seriesUrl = async (where, params) => {
      const row = (
        await pool.query(
          `${ROOTS_CTE}
           SELECT s.slug, t.slug AS type_slug FROM series s
           JOIN brands b ON b.id = s.brand_id
           JOIN roots r ON r.id = s.category_id
           JOIN categories t ON t.id = r.root_id
           WHERE s.is_active AND ${where} LIMIT 1`,
          params
        )
      ).rows[0];
      return row ? `/products/${row.type_slug}/${row.slug}` : null;
    };

    if (third && third !== "cat") {
      // an old series page …
      const asSeries = await seriesUrl("b.slug = $1 AND s.slug = $2", [brand.slug, third]);
      if (asSeries) return res.json({ to: asSeries });
      // … or an old product page: its series, else its type
      const productBy = async (where) =>
        (
          await pool.query(
            `SELECT p.series_id, c.slug AS category_slug FROM products p
             LEFT JOIN categories c ON c.id = p.category_id
             WHERE ${where} LIMIT 1`,
            [third]
          )
        ).rows[0];
      let product = await productBy("p.slug = $1");
      // a product whose URL changed keeps its old slug in product_slug_history
      if (!product && (await pool.query("SELECT to_regclass('product_slug_history') AS t")).rows[0].t) {
        product = await productBy("p.id = (SELECT product_id FROM product_slug_history WHERE old_slug = $1 LIMIT 1)");
      }
      if (product?.series_id) {
        const viaSeries = await seriesUrl("s.id = $1", [product.series_id]);
        if (viaSeries) return res.json({ to: viaSeries });
      }
      const type = await typeOf(product?.category_slug || second);
      return res.json(type ? { to: `/products/${type}` } : home);
    }

    const type = await typeOf(second);
    res.json(type ? { to: `/products/${type}` } : home);
  } catch (err) {
    console.error(err);
    res.json(home);
  }
}
