import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";

const PAGE_SIZE = 10;

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("th-TH", { dateStyle: "medium" });
}

export default function AdminPopupList() {
  const [popups, setPopups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const load = () => {
    setLoading(true);
    api
      .adminGetPopups()
      .then(setPopups)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = popups.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleToggleStatus = async (p) => {
    setError("");
    try {
      await api.adminTogglePopupStatus(p.id, !p.is_active);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (p) => {
    if (!confirm(`ลบป๊อปอัพ "${p.title}"?`)) return;
    setError("");
    try {
      await api.adminDeletePopup(p.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <AdminBreadcrumb items={[{ label: "ป๊อปอัพ" }]} />

      <div className="admin-list-toolbar">
        <input
          type="text"
          placeholder="ค้นหาป๊อปอัพ..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Link to="/admin/popups/new" className="btn btn-primary">
          + เพิ่มป๊อปอัพ
        </Link>
      </div>

      {error && <p className="contact-form__status contact-form__status--error">{error}</p>}

      <div className="admin-list-table-wrap">
        <table className="admin-list-table">
          <thead>
            <tr>
              <th>รูปภาพ</th>
              <th>หัวข้อ</th>
              <th>ช่วงเวลาแสดงผล</th>
              <th>อัพเดท</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="empty-state">
                  กำลังโหลด…
                </td>
              </tr>
            )}
            {!loading && pageItems.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-state">
                  ยังไม่มีป๊อปอัพ — เพิ่มรายการแรกได้เลย
                </td>
              </tr>
            )}
            {!loading &&
              pageItems.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="admin-list-thumb" />
                    ) : (
                      <span className="admin-list-thumb admin-list-thumb--empty" />
                    )}
                  </td>
                  <td>
                    {p.title}
                    {p.message && (
                      <div className="admin-list-table__submeta">
                        {p.message.length > 60 ? `${p.message.slice(0, 60)}…` : p.message}
                      </div>
                    )}
                  </td>
                  <td className="admin-list-table__muted">
                    {p.start_date || p.end_date ? (
                      <>
                        {formatDate(p.start_date) || "ไม่กำหนด"}
                        {" – "}
                        {formatDate(p.end_date) || "ไม่กำหนด"}
                      </>
                    ) : (
                      "แสดงตลอดเวลา"
                    )}
                  </td>
                  <td className="admin-list-table__date">
                    {new Date(p.updated_at).toLocaleString("th-TH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        className={`admin-status-dot ${p.is_active ? "is-active" : ""}`}
                        onClick={() => handleToggleStatus(p)}
                        title={p.is_active ? "กำลังแสดงผล — คลิกเพื่อซ่อน" : "ซ่อนอยู่ — คลิกเพื่อแสดง"}
                      >
                        ✓
                      </button>
                      <Link
                        to={`/admin/popups/${p.id}/edit`}
                        className="admin-icon-btn admin-icon-btn--edit"
                        title="แก้ไข"
                      >
                        ✎
                      </Link>
                      <button
                        className="admin-icon-btn admin-icon-btn--delete"
                        onClick={() => handleDelete(p)}
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
