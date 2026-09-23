import pool from "../config/db.js";

import { interestLabel } from "../utils/contactRequests.js";

// ---------------- combined dashboard payload ----------------
// One round trip for everything the dashboard renders: top-line
// counts, items needing attention, the latest leads/activity, and a
// simple content-volume overview.
export async function getDashboard(req, res) {
  try {
    const [
      productsCount,
      categoriesCount,
      brandsCount,
      seriesCount,
      newLeadsCount,
      missingImageCount,
      missingDatasheetCount,
      recentLeads,
      recentActivity,
    ] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS n FROM products"),
      pool.query("SELECT COUNT(*)::int AS n FROM categories"),
      pool.query("SELECT COUNT(*)::int AS n FROM brands"),
      pool.query("SELECT COUNT(*)::int AS n FROM series"),
      pool.query("SELECT COUNT(*)::int AS n FROM contact_requests WHERE status = 'new'"),
      pool.query(
        "SELECT COUNT(*)::int AS n FROM products WHERE image_url IS NULL OR image_url = ''"
      ),
      pool.query(
        `SELECT COUNT(*)::int AS n FROM products p
         WHERE NOT EXISTS (
           SELECT 1 FROM product_documents d
           WHERE d.product_id = p.id AND d.document_type = 'Datasheet'
         )`
      ),
      pool.query(
        `SELECT id, name, company, email, interested_in, status, created_at
         FROM contact_requests ORDER BY created_at DESC LIMIT 5`
      ),
      pool.query(
        `SELECT id, action_type, description, created_at
         FROM activity_log ORDER BY created_at DESC LIMIT 8`
      ),
    ]);

    const actionRequired = [
      {
        key: "missing-image",
        label: "สินค้าที่ยังไม่มีรูปภาพ",
        count: missingImageCount.rows[0].n,
        link: "/admin/products?issue=missing-image",
      },
      {
        key: "missing-datasheet",
        label: "สินค้าที่ยังไม่มี Datasheet",
        count: missingDatasheetCount.rows[0].n,
        link: "/admin/products?issue=missing-datasheet",
      },
      {
        key: "new-leads",
        label: "คำขอติดต่อใหม่",
        count: newLeadsCount.rows[0].n,
        link: "/admin/contact-requests?status=new",
      },
    ].filter((item) => item.count > 0);

    res.json({
      summary: {
        products: productsCount.rows[0].n,
        categories: categoriesCount.rows[0].n,
        brands: brandsCount.rows[0].n,
        newLeads: newLeadsCount.rows[0].n,
      },
      actionRequired,
      recentLeads: recentLeads.rows.map((r) => ({
        ...r,
        interestLabel: interestLabel(r.interested_in),
      })),
      recentActivity: recentActivity.rows,
      contentStatus: [
        { label: "สินค้า (Products)", count: productsCount.rows[0].n },
        { label: "ซีรีย์ (Series)", count: seriesCount.rows[0].n },
        { label: "หมวดหมู่ (Categories)", count: categoriesCount.rows[0].n },
        { label: "แบรนด์ (Brands)", count: brandsCount.rows[0].n },
      ],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
}
