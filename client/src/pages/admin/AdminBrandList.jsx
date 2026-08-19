import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";

const PAGE_SIZE = 10;

export default function AdminBrandList() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const load = () => {
    setLoading(true);
    api
      .adminGetBrands()
      .then(setBrands)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = brands.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleToggleStatus = async (b) => {
    setError("");
    try {
      await api.adminToggleBrandStatus(b.id, !b.is_active);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReorder = async (id, direction) => {
    setError("");
    try {
      await api.adminReorderBrand(id, direction);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (b) => {
    if (!confirm(`ลบแบรนด์ "${b.name}"?`)) return;
    setError("");
    try {
      await api.adminDeleteBrand(b.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <AdminBreadcrumb items={[{ label: "แบรนด์" }]} />

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
        <Link to="/admin/brands/new" className="btn btn-primary">
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
              <th>จัดเรียง</th>
              <th>อัพเดท</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="empty-state">
                  กำลังโหลด…
                </td>
              </tr>
            )}
            {!loading && pageItems.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-state">
                  ไม่มีข้อมูล
                </td>
              </tr>
            )}
            {!loading &&
              pageItems.map((b, i) => (
                <tr key={b.id}>
                  <td>{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td>
                    {b.logo_url ? (
                      <img src={b.logo_url} alt="" className="admin-list-thumb" />
                    ) : (
                      <span className="admin-list-thumb admin-list-thumb--empty" />
                    )}
                  </td>
                  <td>{b.name}</td>
                  <td>
                    <div className="admin-sort-arrows">
                      <button onClick={() => handleReorder(b.id, "up")} aria-label="เลื่อนขึ้น">
                        ↑
                      </button>
                      <button onClick={() => handleReorder(b.id, "down")} aria-label="เลื่อนลง">
                        ↓
                      </button>
                    </div>
                  </td>
                  <td className="admin-list-table__date">
                    {new Date(b.updated_at).toLocaleString("th-TH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        className={`admin-status-dot ${b.is_active ? "is-active" : ""}`}
                        onClick={() => handleToggleStatus(b)}
                        title={b.is_active ? "กำลังแสดงผล — คลิกเพื่อซ่อน" : "ซ่อนอยู่ — คลิกเพื่อแสดง"}
                      >
                        ✓
                      </button>
                      <Link
                        to={`/admin/brands/${b.id}/edit`}
                        className="admin-icon-btn admin-icon-btn--edit"
                        title="แก้ไข"
                      >
                        ✎
                      </Link>
                      <button
                        className="admin-icon-btn admin-icon-btn--delete"
                        onClick={() => handleDelete(b)}
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
