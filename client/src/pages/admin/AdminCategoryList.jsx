import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";

const PAGE_SIZE = 20;

// Flattens the parent_id tree into a depth-ordered list (parents
// immediately followed by their children, sorted by sort_order at each
// level) so the table can render it with "- " / "-- " indentation like
// the reference screenshot.
function flattenTree(categories) {
  const byParent = new Map();
  for (const c of categories) {
    const key = c.parent_id ?? "root";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(c);
  }
  for (const list of byParent.values()) list.sort((a, b) => a.sort_order - b.sort_order);

  const result = [];
  function walk(parentKey, depth) {
    for (const child of byParent.get(parentKey) || []) {
      result.push({ ...child, depth });
      walk(child.id, depth + 1);
    }
  }
  walk("root", 0);
  return result;
}

export default function AdminCategoryList() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const load = () => {
    setLoading(true);
    api
      .adminGetCategories()
      .then(setCategories)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const tree = flattenTree(categories);
  const filtered = tree.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleToggleStatus = async (c) => {
    setError("");
    try {
      await api.adminToggleCategoryStatus(c.id, !c.is_active);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReorder = async (id, direction) => {
    setError("");
    try {
      await api.adminReorderCategory(id, direction);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (c) => {
    if (!confirm(`ลบหมวดหมู่ "${c.name}"?`)) return;
    setError("");
    try {
      await api.adminDeleteCategory(c.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <AdminBreadcrumb items={[{ label: "หมวดหมู่" }]} />

      <div className="admin-list-toolbar">
        <input
          type="text"
          placeholder="ค้นหา..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Link to="/admin/categories/new" className="btn btn-primary">
          + เพิ่ม
        </Link>
      </div>

      {error && <p className="contact-form__status contact-form__status--error">{error}</p>}

      <div className="admin-list-table-wrap">
        <table className="admin-list-table">
          <thead>
            <tr>
              <th>ลำดับ</th>
              <th>รูปภาพ</th>
              <th>ชื่อ</th>
              <th>หมวดหมู่แม่</th>
              <th>จัดเรียง</th>
              <th>อัพเดท</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="empty-state">
                  กำลังโหลด…
                </td>
              </tr>
            )}
            {!loading && pageItems.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-state">
                  ไม่มีข้อมูล
                </td>
              </tr>
            )}
            {!loading &&
              pageItems.map((c, i) => (
                <tr key={c.id}>
                  <td>{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td>
                    {c.image_url ? (
                      <img src={c.image_url} alt="" className="admin-list-thumb" />
                    ) : (
                      <span className="admin-list-thumb admin-list-thumb--empty" />
                    )}
                  </td>
                  <td>
                    <span className="admin-tree-indent">
                      {c.depth > 0 ? "- ".repeat(c.depth) : ""}
                      {c.name}
                    </span>
                  </td>
                  <td className="admin-list-table__muted">
                    {categories.find((p) => p.id === c.parent_id)?.name || "—"}
                  </td>
                  <td>
                    <div className="admin-sort-arrows">
                      <button onClick={() => handleReorder(c.id, "up")} aria-label="เลื่อนขึ้น">
                        ↑
                      </button>
                      <button onClick={() => handleReorder(c.id, "down")} aria-label="เลื่อนลง">
                        ↓
                      </button>
                    </div>
                  </td>
                  <td className="admin-list-table__date">
                    {new Date(c.updated_at).toLocaleString("th-TH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        className={`admin-status-dot ${c.is_active ? "is-active" : ""}`}
                        onClick={() => handleToggleStatus(c)}
                        title={c.is_active ? "กำลังแสดงผล — คลิกเพื่อซ่อน" : "ซ่อนอยู่ — คลิกเพื่อแสดง"}
                      >
                        ✓
                      </button>
                      <Link
                        to={`/admin/categories/${c.id}/edit`}
                        className="admin-icon-btn admin-icon-btn--edit"
                        title="แก้ไข"
                      >
                        ✎
                      </Link>
                      <button
                        className="admin-icon-btn admin-icon-btn--delete"
                        onClick={() => handleDelete(c)}
                        title="ลบ"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {!loading && filtered.length > 0 && (
        <div className="admin-pagination">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            ก่อนหน้า
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
            ถัดไป
          </button>
          <span className="admin-pagination__total">
            {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} จาก{" "}
            {filtered.length} รายการ
          </span>
        </div>
      )}
    </>
  );
}
