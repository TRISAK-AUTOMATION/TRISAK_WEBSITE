import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";

const PAGE_SIZE = 10;

export default function AdminSeriesList() {
  const [seriesList, setSeriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const load = () => {
    setLoading(true);
    api
      .adminGetSeriesList()
      .then(setSeriesList)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = seriesList.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleToggleStatus = async (s) => {
    setError("");
    try {
      await api.adminToggleSeriesStatus(s.id, !s.is_active);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReorder = async (id, direction) => {
    setError("");
    try {
      await api.adminReorderSeries(id, direction);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (s) => {
    if (!confirm(`ลบซีรีย์ "${s.name}"?`)) return;
    setError("");
    try {
      await api.adminDeleteSeries(s.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <AdminBreadcrumb items={[{ label: "ซีรีย์" }]} />

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
        <Link to="/admin/series/new" className="btn btn-primary">
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
              <th>แบรนด์ / หมวดหมู่</th>
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
              pageItems.map((s, i) => (
                <tr key={s.id}>
                  <td>{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td>
                    {s.image_url ? (
                      <img src={s.image_url} alt="" className="admin-list-thumb" />
                    ) : (
                      <span className="admin-list-thumb admin-list-thumb--empty" />
                    )}
                  </td>
                  <td>
                    {s.name} {s.is_new && <span className="admin-badge-new">NEW</span>}
                  </td>
                  <td className="admin-list-table__muted">
                    {s.brand_name} / {s.category_name}
                  </td>
                  <td>
                    <div className="admin-sort-arrows">
                      <button onClick={() => handleReorder(s.id, "up")} aria-label="เลื่อนขึ้น">
                        ↑
                      </button>
                      <button onClick={() => handleReorder(s.id, "down")} aria-label="เลื่อนลง">
                        ↓
                      </button>
                    </div>
                  </td>
                  <td className="admin-list-table__date">
                    {new Date(s.updated_at).toLocaleString("th-TH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        className={`admin-status-dot ${s.is_active ? "is-active" : ""}`}
                        onClick={() => handleToggleStatus(s)}
                        title={s.is_active ? "กำลังแสดงผล — คลิกเพื่อซ่อน" : "ซ่อนอยู่ — คลิกเพื่อแสดง"}
                      >
                        ✓
                      </button>
                      <Link
                        to={`/admin/series/${s.id}/edit`}
                        className="admin-icon-btn admin-icon-btn--edit"
                        title="แก้ไข"
                      >
                        ✎
                      </Link>
                      <button
                        className="admin-icon-btn admin-icon-btn--delete"
                        onClick={() => handleDelete(s)}
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
