import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";
import AdminModal, { ConfirmModal, ModalButton, useToast } from "../../components/AdminModal.jsx";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

const formatDate = (value) =>
  new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

const truncate = (text, max) => (text.length > max ? `${text.slice(0, max)}…` : text);

function StatusSelect({ value, onChange, disabled }) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      className={`lead-status-select lead-status-select--${value}`}
      aria-label="Request status"
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function DetailRow({ label, children }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </>
  );
}

function RequestModal({ request, onClose, onStatusChange, onDelete }) {
  return (
    <AdminModal
      title={`Contact Request #${request.id}`}
      size="md"
      onClose={onClose}
      footer={
        <>
          <label className="admin-modal__status admin-modal__push">
            Status
            <StatusSelect
              value={request.status}
              onChange={(status) => onStatusChange(request, status)}
            />
          </label>
          <ModalButton variant="danger" onClick={() => onDelete(request)}>
            Delete
          </ModalButton>
          <ModalButton onClick={onClose}>Close</ModalButton>
        </>
      }
    >
      <dl className="cr-detail">
        <DetailRow label="Name">{request.name}</DetailRow>
        <DetailRow label="Company">{request.company || "—"}</DetailRow>
        <DetailRow label="Email">
          <a href={`mailto:${request.email}`}>{request.email}</a>
        </DetailRow>
        <DetailRow label="Phone">
          {request.phone ? <a href={`tel:${request.phone}`}>{request.phone}</a> : "—"}
        </DetailRow>
        <DetailRow label="Interested In">{request.interestLabel}</DetailRow>
        <DetailRow label="Submitted At">{formatDate(request.created_at)}</DetailRow>
        <DetailRow label="Last Updated">{formatDate(request.updated_at)}</DetailRow>
        <DetailRow label="Message">
          {request.message ? <div className="cr-detail__message">{request.message}</div> : "—"}
        </DetailRow>
      </dl>
    </AdminModal>
  );
}

export default function AdminContactRequests() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = STATUS_OPTIONS.some((o) => o.value === searchParams.get("status"))
    ? searchParams.get("status")
    : "";

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({ new: 0, in_progress: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState(""); // debounced value actually sent to the API
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [sort, setSort] = useState("desc"); // newest first
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState(null);

  // delete confirmation popup + success toast
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const { toast, showToast } = useToast();

  // Only the latest request may update the table — prevents a slow,
  // older response from overwriting a newer one while typing/filtering.
  const requestSeq = useRef(0);

  const load = useCallback(
    ({ silent = false } = {}) => {
      const seq = ++requestSeq.current;
      if (!silent) setLoading(true);
      return api
        .adminGetContactRequests({
          q: search,
          status: statusFilter,
          sort,
          page,
          pageSize: PAGE_SIZE,
        })
        .then((data) => {
          if (seq !== requestSeq.current) return;
          // Deleting the last row of the last page leaves it empty — step back.
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
    [search, statusFilter, sort, page]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Debounce the search box.
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  const changeStatusFilter = (value) => {
    setStatusFilter(value);
    setPage(1);
    setSearchParams(value ? { status: value } : {}, { replace: true });
  };

  const toggleSort = () => {
    setSort((s) => (s === "desc" ? "asc" : "desc"));
    setPage(1);
  };

  const handleStatusChange = async (request, status) => {
    if (status === request.status) return;
    const previous = request.status;
    const apply = (s) => {
      setItems((prev) => prev.map((r) => (r.id === request.id ? { ...r, status: s } : r)));
      setSelected((cur) => (cur && cur.id === request.id ? { ...cur, status: s } : cur));
    };
    apply(status); // optimistic
    try {
      const updated = await api.adminUpdateContactRequestStatus(request.id, status);
      setSelected((cur) => (cur && cur.id === request.id ? { ...cur, ...updated } : cur));
      load({ silent: true }); // refresh counts / respect the active filter
    } catch (err) {
      apply(previous);
      alert(err.message);
    }
  };

  // Clicking a Delete button only opens the confirmation popup.
  const handleDelete = (request) => {
    setDeleteError("");
    setDeleteTarget(request);
  };

  const cancelDelete = useCallback(() => setDeleteTarget(null), []);

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await api.adminDeleteContactRequest(deleteTarget.id);
      setDeleteTarget(null);
      setSelected(null);
      showToast("Contact request deleted successfully.");
      load({ silent: true });
    } catch {
      // keep the popup open and the request in the list
      setDeleteError("The contact request could not be deleted. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = Boolean(search || statusFilter);

  return (
    <>
      <AdminBreadcrumb items={[{ label: "Contact Requests" }]} />

      <div className="cr-toolbar">
        <input
          type="search"
          placeholder="Search name, company, email, interested in…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select
          value={statusFilter}
          onChange={(e) => changeStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">
            All statuses ({counts.new + counts.in_progress + counts.completed})
          </option>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label} ({counts[opt.value]})
            </option>
          ))}
        </select>
      </div>

      {error && <p className="contact-form__status contact-form__status--error">{error}</p>}

      <div className="admin-list-table-wrap">
        <table className="admin-list-table" style={{ minWidth: 1100 }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Interested In</th>
              <th>Message</th>
              <th aria-sort={sort === "desc" ? "descending" : "ascending"}>
                <button
                  type="button"
                  className="cr-sort-btn"
                  onClick={toggleSort}
                  title={sort === "desc" ? "Newest first — click for oldest first" : "Oldest first — click for newest first"}
                >
                  Submitted At {sort === "desc" ? "↓" : "↑"}
                </button>
              </th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && items.length === 0 && (
              <tr>
                <td colSpan={9} className="empty-state">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={9} className="empty-state">
                  {hasFilters ? "No requests match your search." : "No contact requests yet."}
                </td>
              </tr>
            )}
            {items.map((r) => (
              <tr key={r.id} className="cr-row" onClick={() => setSelected(r)}>
                <td>{r.name}</td>
                <td>{r.company || "—"}</td>
                <td className="admin-list-table__muted">{r.email}</td>
                <td className="admin-list-table__muted">{r.phone || "—"}</td>
                <td className="admin-list-table__muted">{r.interestLabel}</td>
                <td className="cr-message-cell">{r.message ? truncate(r.message, 80) : "—"}</td>
                <td className="admin-list-table__date">{formatDate(r.created_at)}</td>
                <td>
                  <StatusSelect
                    value={r.status}
                    onChange={(status) => handleStatusChange(r, status)}
                  />
                </td>
                <td>
                  <div className="cr-actions">
                    <button
                      type="button"
                      className="admin-icon-btn admin-icon-btn--view"
                      title="View details"
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
                      title="Delete"
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
            Previous
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
          <span className="admin-pagination__total">
            {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} of {total}
          </span>
        </div>
      )}

      {selected && (
        <RequestModal
          request={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Contact Request?"
          message="Are you sure you want to delete this contact request? This action cannot be undone."
          detail={`${deleteTarget.name}${deleteTarget.company ? ` · ${deleteTarget.company}` : ""}`}
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
