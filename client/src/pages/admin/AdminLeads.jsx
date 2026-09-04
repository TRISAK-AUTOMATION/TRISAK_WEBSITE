import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "new", label: "ใหม่" },
  { value: "quoted", label: "เสนอราคาแล้ว" },
  { value: "follow_up", label: "ติดตามผล" },
  { value: "closed", label: "ปิดงาน" },
];

export default function AdminLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get("status") || "";

  const load = () => {
    setLoading(true);
    api
      .adminGetLeads()
      .then(setLeads)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (statusFilter && l.status !== statusFilter) return false;
      const q = search.toLowerCase();
      if (!q) return true;
      return (
        (l.company || "").toLowerCase().includes(q) ||
        (l.name || "").toLowerCase().includes(q) ||
        (l.email || "").toLowerCase().includes(q)
      );
    });
  }, [leads, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleStatusChange = async (id, status) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    try {
      await api.adminUpdateLeadStatus(id, status);
    } catch (err) {
      alert(err.message);
      load();
    }
  };

  const clearFilter = () => {
    setSearchParams({});
    setPage(1);
  };

  return (
    <>
      <AdminBreadcrumb items={[{ label: "คำขอติดต่อ" }]} />

      <div className="admin-list-toolbar">
        <input
          type="text"
          placeholder="ค้นหาบริษัท, ชื่อ, อีเมล..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        {statusFilter && (
          <button type="button" className="btn" onClick={clearFilter}>
            ล้างตัวกรอง: {STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label || statusFilter} ✕
          </button>
        )}
      </div>

      {error && <p className="contact-form__status contact-form__status--error">{error}</p>}

      <div className="admin-list-table-wrap">
        <table className="admin-list-table">
          <thead>
            <tr>
              <th>บริษัท / ชื่อ</th>
              <th>ติดต่อ</th>
              <th>สนใจ</th>
              <th>ข้อความ</th>
              <th>สถานะ</th>
              <th>วันที่</th>
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
                  ไม่พบคำขอติดต่อ
                </td>
              </tr>
            )}
            {!loading &&
              pageItems.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    {lead.company || "—"}
                    <div className="admin-list-table__submeta">{lead.name}</div>
                  </td>
                  <td className="admin-list-table__muted">
                    {lead.email}
                    {lead.phone && <div className="admin-list-table__submeta">{lead.phone}</div>}
                  </td>
                  <td className="admin-list-table__muted">{lead.interestLabel}</td>
                  <td className="admin-list-table__muted" style={{ maxWidth: 260 }}>
                    {lead.message ? (
                      lead.message.length > 80 ? `${lead.message.slice(0, 80)}…` : lead.message
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                      className={`lead-status-select lead-status-select--${lead.status}`}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="admin-list-table__date">
                    {new Date(lead.created_at).toLocaleString("th-TH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
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
