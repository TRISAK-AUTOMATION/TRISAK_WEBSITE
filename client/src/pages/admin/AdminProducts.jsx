import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";

const PAGE_SIZE = 10;

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const load = () => {
    setLoading(true);
    api
      .adminGetProducts()
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async (id, name) => {
    if (!confirm(`ลบสินค้า "${name}"?`)) return;
    try {
      await api.adminDeleteProduct(id);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReorder = async (id, direction) => {
    setError("");
    try {
      await api.adminReorderProduct(id, direction);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <AdminBreadcrumb items={[{ label: "รายการ" }]} />

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
        <Link to="/admin/products/new" className="btn btn-primary">
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
              <th>แบรนด์ / หมวดหมู่ / ซีรีย์</th>
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
                  ยังไม่มีสินค้า — เพิ่มรายการแรกได้เลย
                </td>
              </tr>
            )}
            {!loading &&
              pageItems.map((p, i) => (
                <tr key={p.id}>
                  <td>{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td>
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="admin-list-thumb" />
                    ) : (
                      <span className="admin-list-thumb admin-list-thumb--empty" />
                    )}
                  </td>
                  <td>
                    {p.name} {p.is_new && <span className="admin-badge-new">NEW</span>}
                    <div className="admin-list-table__submeta">{p.model}</div>
                  </td>
                  <td className="admin-list-table__muted">
                    {p.brand} / {p.category}
                    {p.series ? ` / ${p.series}` : ""}
                  </td>
                  <td>
                    <div className="admin-sort-arrows">
                      <button onClick={() => handleReorder(p.id, "up")} aria-label="เลื่อนขึ้น">
                        ↑
                      </button>
                      <button onClick={() => handleReorder(p.id, "down")} aria-label="เลื่อนลง">
                        ↓
                      </button>
                    </div>
                  </td>
                  <td className="admin-list-table__date">
                    {new Date(p.updated_at).toLocaleString("th-TH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <Link
                        to={`/admin/products/${p.id}/edit`}
                        className="admin-icon-btn admin-icon-btn--edit"
                        title="แก้ไข"
                      >
                        ✎
                      </Link>
                      <button
                        className="admin-icon-btn admin-icon-btn--delete"
                        onClick={() => handleDelete(p.id, p.name)}
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
