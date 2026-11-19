import pool from "../config/db.js";

/**
 * Links products to their series automatically by model code.
 *
 * A series lists the model codes its products start with in
 * `series.model_prefixes` (comma or new-line separated, e.g. "3G3MX2-").
 * Every product of the same brand that has no series yet and whose model
 * (or item no.) starts with one of them is linked to that series; when
 * several prefixes match, the longest wins. Products already linked — by
 * hand or earlier — are never changed.
 *
 * Runs on server start and after any admin change to products or series
 * (see index.js). Returns the number of products linked.
 */
let hasItemNo = null; // products.item_no exists only on databases with the import migrations

export async function autoLinkProducts() {
  if (hasItemNo === null) {
    const { rows } = await pool.query(
      "SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'item_no'"
    );
    hasItemNo = rows.length > 0;
  }
  const itemNoMatch = hasItemNo ? "OR upper(coalesce(p.item_no, '')) LIKE pref.prefix || '%'" : "";
  const { rowCount } = await pool.query(`
    WITH pref AS (
      SELECT s.id AS series_id, s.brand_id,
             replace(replace(upper(trim(x)), '_', '\\_'), '%', '\\%') AS prefix,
             length(trim(x)) AS len
      FROM series s,
           unnest(regexp_split_to_array(coalesce(s.model_prefixes, ''), '[\\n,]+')) AS x
      WHERE s.is_active AND trim(x) <> ''
    ),
    best AS (
      SELECT DISTINCT ON (p.id) p.id, pref.series_id
      FROM products p
      JOIN pref ON pref.brand_id = p.brand_id
       AND (upper(coalesce(p.model, '')) LIKE pref.prefix || '%' ${itemNoMatch})
      WHERE p.series_id IS NULL
      ORDER BY p.id, pref.len DESC
    )
    UPDATE products p SET series_id = best.series_id
    FROM best WHERE p.id = best.id`);
  return rowCount;
}

/** Express middleware: re-link after a successful admin write to products / series. */
export function autoLinkAfterAdminWrites(req, res, next) {
  if (req.method !== "GET" && /^\/admin\/(products|series)\b/.test(req.path)) {
    res.on("finish", () => {
      if (res.statusCode < 400) {
        autoLinkProducts().catch((err) => console.error("Series auto-link failed:", err.message));
      }
    });
  }
  next();
}
