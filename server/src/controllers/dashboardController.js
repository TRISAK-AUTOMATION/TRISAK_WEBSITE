import pool from "../config/db.js";

const LEAD_STATUSES = ["new", "quoted", "follow_up", "closed"];

// Friendly labels for the "interested in" enum captured by the public
// contact form (see contactController.js VALID_INTERESTS).
const INTEREST_LABELS = {
  products: "สินค้า",
  automation_solution: "โซลูชันระบบอัตโนมัติ",
  technical_support: "ทีมสนับสนุนด้านเทคนิค",
};

function interestLabel(value) {
  return INTEREST_LABELS[value] || value || "—";
}

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
      pool.query("SELECT COUNT(*)::int AS n FROM contact_submissions WHERE status = 'new'"),
      pool.query(
        "SELECT COUNT(*)::int AS n FROM products WHERE image_url IS NULL OR image_url = ''"
      ),
      pool.query(
        `SELECT COUNT(*)::int AS n FROM products p
         WHERE NOT EXISTS (
           SELECT 1 FROM product_documents d
           WHERE d.product_id = p.id AND d.label ILIKE '%datasheet%'
         )`
      ),
      pool.query(
        `SELECT id, name, company, email, interested_in, status, created_at
         FROM contact_submissions ORDER BY created_at DESC LIMIT 5`
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
        link: "/admin/leads?status=new",
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

// ---------------- leads (contact submissions) ----------------

export async function listLeadsAdmin(req, res) {
  try {
    const limitParam = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : null;
    const { rows } = await pool.query(
      `SELECT id, name, company, email, phone, interested_in, message, status, created_at
       FROM contact_submissions
       ORDER BY created_at DESC
       ${limit ? "LIMIT $1" : ""}`,
      limit ? [limit] : []
    );
    res.json(rows.map((r) => ({ ...r, interestLabel: interestLabel(r.interested_in) })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load leads" });
  }
}

export async function updateLeadStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body || {};
  if (!LEAD_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${LEAD_STATUSES.join(", ")}` });
  }
  try {
    const result = await pool.query(
      "UPDATE contact_submissions SET status = $1 WHERE id = $2",
      [status, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Lead not found" });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update lead" });
  }
}
