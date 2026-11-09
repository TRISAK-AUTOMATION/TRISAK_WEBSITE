import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";
import AdminModal, { ConfirmModal, ModalButton, useToast } from "../../components/AdminModal.jsx";

/**
 * Admin > ตำแหน่งงาน > คำขอสมัครงาน — /admin/career/applications
 * Applications sent from the "สมัครงานตำแหน่งนี้" popup on the Career page.
 * Same layout and behaviour as Contact Requests (search, filters, status,
 * detail popup, delete) plus a position filter and résumé download.
 */

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "new", label: "ใหม่" },
  { value: "reviewing", label: "กำลังพิจารณา" },
  { value: "interview", label: "นัดสัมภาษณ์" },
  { value: "hired", label: "รับเข้าทำงาน" },
  { value: "rejected", label: "ไม่ผ่าน" },
];

const formatDate = (value) =>
  new Date(value).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });

const formatSize = (bytes) =>
  !bytes ? "" : bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const truncate = (text, max) => (text.length > max ? `${text.slice(0, max)}…` : text);

function StatusSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      className={`lead-status-select app-status-select app-status-select--${value}`}
      aria-label="สถานะใบสมัคร"
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function ResumeButton({ application, onDownload, busy, compact = false }) {
  if (!application.has_resume) return <span className="admin-list-table__muted">—</span>;
  return (
    <button
      type="button"
      className={`btn app-resume-btn${compact ? " app-resume-btn--compact" : ""}`}
      disabled={busy}
      onClick={(e) => {
        e.stopPropagation();
        onDownload(application);
      }}
      title={application.resume_name || "Resume"}
    >
      📄 {busy ? "กำลังดาวน์โหลด…" : compact ? "ดาวน์โหลด" : `ดาวน์โหลด Resume${application.resume_size ? ` (${formatSize(application.resume_size)})` : ""}`}
    </button>
  );
}

function ApplicationModal({ application, onClose, onStatusChange, onDelete, onDownload, downloading }) {
  return (
    <AdminModal
      title={`ใบสมัครงาน #${application.id}`}
      size="md"
      onClose={onClose}
      footer={
        <>
          <label className="admin-modal__status admin-modal__push">
            สถานะ
            <StatusSelect value={application.status} onChange={(status) => onStatusChange(application, status)} />
          </label>
          <ModalButton variant="danger" onClick={() => onDelete(application)}>
            ลบ
          </ModalButton>
          <ModalButton onClick={onClose}>ปิด</ModalButton>
        </>
      }
    >
      <dl className="cr-detail">
        <dt>ตำแหน่งที่สมัคร</dt>
        <dd>
          {application.job_title || "—"}
          {!application.job_id && <span className="app-job-removed"> (ตำแหน่งนี้ถูกลบแล้ว)</span>}
        </dd>
        <dt>ชื่อ-นามสกุล</dt>
        <dd>{application.full_name}</dd>
        <dt>เบอร์ติดต่อ</dt>
        <dd>
          <a href={`tel:${application.phone.replace(/[^\d+]/g, "")}`}>{application.phone}</a>
        </dd>
        <dt>อีเมล</dt>
        <dd>
          <a href={`mailto:${application.email}`}>{application.email}</a>
        </dd>
        <dt>Resume</dt>
        <dd>
          <ResumeButton application={application} onDownload={onDownload} busy={downloading === application.id} />
          {application.resume_name && <div className="app-resume-name">{application.resume_name}</div>}
        </dd>
        <dt>วันที่สมัคร</dt>
        <dd>{formatDate(application.created_at)}</dd>
        <dt>อัปเดตล่าสุด</dt>
        <dd>{formatDate(application.updated_at)}</dd>
        <dt>ข้อความ</dt>
        <dd>{application.message ? <div className="cr-detail__message">{application.message}</div> : "—"}</dd>
      </dl>
    </AdminModal>
  );
}

export default function AdminCareerApplications() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = STATUS_OPTIONS.some((o) => o.value === searchParams.get("status")) ? searchParams.get("status") : "";

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({});
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [jobFilter, setJobFilter] = useState(searchParams.get("job") || "");
  const [sort, setSort] = useState("desc");
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState(null);
  const [downloading, setDownloading] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const { toast, showToast } = useToast();

  const requestSeq = useRef(0);

  useEffect(() => {
    api.adminGetCareerJobs().then(setJobs).catch(() => setJobs([]));
  }, []);

  const load = useCallback(
    ({ silent = false } = {}) => {
      const seq = ++requestSeq.current;
      if (!silent) setLoading(true);
      return api
        .adminGetCareerApplications({ q: search, status: statusFilter, jobId: jobFilter, sort, page, pageSize: PAGE_SIZE })
        .then((data) => {
          if (seq !== requestSeq.current) return;
          if (data.items.length === 0 && data.total > 0 && page > 1) {
            setPage(Math.max(1, Math.ceil(data.total / PAGE_SIZE)));
            return;
          }
          setItems(data.items);
          setTotal(data.total);
          setCounts(data.counts);
          setError("");
        })
        .catch((err) => {
          if (seq === requestSeq.current) setError(err.message);
        })
        .finally(() => {
          if (seq === requestSeq.current) setLoading(false);
        });
    },
    [search, statusFilter, jobFilter, sort, page]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  const syncParams = (status, job) => {
    const p = {};
    if (status) p.status = status;
    if (job) p.job = job;
    setSearchParams(p, { replace: true });
  };
  const changeStatusFilter = (value) => {
    setStatusFilter(value);
    setPage(1);
    syncParams(value, jobFilter);
  };
  const changeJobFilter = (value) => {
    setJobFilter(value);
    setPage(1);
    syncParams(statusFilter, value);
  };

  const handleStatusChange = async (app, status) => {
    if (status === app.status) return;
    const previous = app.status;
    const apply = (s) => {
      setItems((prev) => prev.map((r) => (r.id === app.id ? { ...r, status: s } : r)));
      setSelected((cur) => (cur && cur.id === app.id ? { ...cur, status: s } : cur));
    };
    apply(status);
    try {
      const updated = await api.adminUpdateCareerApplicationStatus(app.id, status);
      setSelected((cur) => (cur && cur.id === app.id ? { ...cur, ...updated } : cur));
      load({ silent: true });
    } catch (err) {
      apply(previous);
      alert(err.message);
    }
  };

  const handleDownload = async (app) => {
    setDownloading(app.id);
    try {
      const blob = await api.adminDownloadCareerResume(app.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = app.resume_name || `resume-${app.id}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      alert(err.message);
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = (app) => {
    setDeleteError("");
    setDeleteTarget(app);
  };
  const cancelDelete = useCallback(() => setDeleteTarget(null), []);
  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await api.adminDeleteCareerApplication(deleteTarget.id);
      setDeleteTarget(null);
      setSelected(null);
      showToast("ลบใบสมัครเรียบร้อยแล้ว");
      load({ silent: true });
    } catch {
      setDeleteError("ลบใบสมัครไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = Boolean(search || statusFilter || jobFilter);
  const allCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const jobTitle = (j) => j.title?.th || j.title?.en || `#${j.id}`;

  return (
    <>
      <AdminBreadcrumb items={[{ label: "ตำแหน่งงาน", to: "/admin/career" }, { label: "คำขอสมัครงาน" }]} />

      <div className="cr-toolbar app-toolbar">
        <input
          type="search"
          placeholder="ค้นหาชื่อ อีเมล เบอร์โทร ตำแหน่ง…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="ค้นหาใบสมัคร"
        />
        <select value={jobFilter} onChange={(e) => changeJobFilter(e.target.value)} aria-label="กรองตามตำแหน่ง">
          <option value="">ทุกตำแหน่ง</option>
          {jobs.map((j) => (
            <option key={j.id} value={String(j.id)}>
              {jobTitle(j)}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => changeStatusFilter(e.target.value)} aria-label="กรองตามสถานะ">
          <option value="">ทุกสถานะ ({allCount})</option>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label} ({counts[opt.value] || 0})
            </option>
          ))}
        </select>
      </div>

      {error && <p className="contact-form__status contact-form__status--error">{error}</p>}

      <div className="admin-list-table-wrap">
        <table className="admin-list-table" style={{ minWidth: 1100 }}>
          <thead>
            <tr>
              <th>ชื่อ-นามสกุล</th>
              <th>ตำแหน่งที่สมัคร</th>
              <th>เบอร์ติดต่อ</th>
              <th>อีเมล</th>
              <th>Resume</th>
              <th>ข้อความ</th>
              <th aria-sort={sort === "desc" ? "descending" : "ascending"}>
                <button
                  type="button"
                  className="cr-sort-btn"
                  onClick={() => {
                    setSort((s) => (s === "desc" ? "asc" : "desc"));
                    setPage(1);
                  }}
                  title={sort === "desc" ? "ใหม่สุดก่อน — กดเพื่อเรียงเก่าสุดก่อน" : "เก่าสุดก่อน — กดเพื่อเรียงใหม่สุดก่อน"}
                >
                  วันที่สมัคร {sort === "desc" ? "↓" : "↑"}
                </button>
              </th>
              <th>สถานะ</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading && items.length === 0 && (
              <tr>
                <td colSpan={9} className="empty-state">กำลังโหลด…</td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={9} className="empty-state">
                  {hasFilters ? "ไม่พบใบสมัครที่ตรงกับการค้นหา" : "ยังไม่มีใบสมัครงาน"}
                </td>
              </tr>
            )}
            {items.map((r) => (
              <tr key={r.id} className={`cr-row${r.status === "new" ? " app-row--new" : ""}`} onClick={() => setSelected(r)}>
                <td>{r.full_name}</td>
                <td>{r.job_title || "—"}</td>
                <td className="admin-list-table__muted app-phone-cell">{r.phone}</td>
                <td className="admin-list-table__muted">{r.email}</td>
                <td>
                  <ResumeButton application={r} onDownload={handleDownload} busy={downloading === r.id} compact />
                </td>
                <td className="cr-message-cell">{r.message ? truncate(r.message, 60) : "—"}</td>
                <td className="admin-list-table__date">{formatDate(r.created_at)}</td>
                <td>
                  <StatusSelect value={r.status} onChange={(status) => handleStatusChange(r, status)} />
                </td>
                <td>
                  <div className="cr-actions">
                    <button
                      type="button"
                      className="admin-icon-btn admin-icon-btn--view"
                      title="ดูรายละเอียด"
                      aria-label={`ดูใบสมัครของ ${r.full_name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(r);
                      }}
                    >
                      👁
                    </button>
                    <button
                      type="button"
                      className="admin-icon-btn admin-icon-btn--delete"
                      title="ลบ"
                      aria-label={`ลบใบสมัครของ ${r.full_name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(r);
                      }}
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

      {total > 0 && (
        <div className="admin-pagination">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            ก่อนหน้า
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            ถัดไป
          </button>
          <span className="admin-pagination__total">
            {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} จาก {total}
          </span>
        </div>
      )}

      {selected && (
        <ApplicationModal
          application={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onDownload={handleDownload}
          downloading={downloading}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="ลบใบสมัครงาน?"
          message="ต้องการลบใบสมัครนี้ใช่หรือไม่? ไฟล์ Resume จะถูกลบด้วย และไม่สามารถย้อนกลับได้"
          detail={`${deleteTarget.full_name}${deleteTarget.job_title ? ` · ${deleteTarget.job_title}` : ""}`}
          confirmLabel="ลบ"
          cancelLabel="ยกเลิก"
          busyLabel="กำลังลบ…"
          busy={deleting}
          error={deleteError}
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
        />
      )}

      {toast}
    </>
  );
}
