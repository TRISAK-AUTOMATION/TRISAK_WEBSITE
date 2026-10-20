import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import AdminBreadcrumb from "./AdminBreadcrumb.jsx";
import SuccessModal from "./SuccessModal.jsx";
import { ConfirmModal, useToast } from "./AdminModal.jsx";
import { AdminEditLayout, AdminLanguageSelect, AdminStatusToggle } from "./AdminEditSidebar.jsx";

/**
 * Shared pieces for the History page's admin editors (Timeline, Statistics,
 * Organization Structure). All three follow the Industries list + form
 * convention: a management list (status toggle, reorder arrows, edit,
 * delete — each destructive action behind a ConfirmModal) and a dedicated
 * Add/Edit page with the EN/TH dropdown, status toggle and SuccessModal.
 */

export const HISTORY_ADMIN_BASE = "/admin/about";

const TABS = [
  { to: HISTORY_ADMIN_BASE, label: "ข้อความหน้า (Intro)", end: true },
  { to: `${HISTORY_ADMIN_BASE}/timeline`, label: "ไทม์ไลน์ (Timeline)" },
  { to: `${HISTORY_ADMIN_BASE}/statistics`, label: "สถิติ (Statistics)" },
  { to: `${HISTORY_ADMIN_BASE}/organization`, label: "โครงสร้างองค์กร (Organization)" },
];

/** Tab strip linking the four History editors (it lives inside the existing History menu item). */
export function AdminHistoryTabs() {
  return (
    <nav className="admin-edit-tabs" aria-label="History sections">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) => `admin-edit-tab ${isActive ? "is-active" : ""}`}
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}

/** Breadcrumb + tab strip shown at the top of every History sub-page. */
export function HistoryPageHeader({ crumbs = [] }) {
  return (
    <>
      <AdminBreadcrumb items={[{ label: "ประวัติบริษัท (History)", to: HISTORY_ADMIN_BASE }, ...crumbs]} />
      <div className="admin-edit-tabbar">
        <AdminHistoryTabs />
      </div>
    </>
  );
}

// ------------------------------------------------------------------
// List page
// ------------------------------------------------------------------

/**
 * Props:
 *  section      API segment: "timeline" | "statistics" | "organization"
 *  tabLabel     breadcrumb label for this list
 *  basePath     route of this list (add = `${basePath}/new`, edit = `${basePath}/:id/edit`)
 *  noun         "entry" | "statistic" | "node" — used in messages
 *  hint         one-line description under the breadcrumb
 *  addLabel     text for the "+ Add" button
 *  columns      [{ header, render(row, index) }] — the section-specific cells
 *  rowLabel     (row) => string shown in confirmation dialogs
 *  prepareRows  optional (rows) => rows to display (the org chart flattens its tree here)
 *  canMove      optional (row, rows, "up"|"down") => boolean (defaults to list neighbours)
 *  disableNote  optional extra sentence for the disable confirmation
 */
export function HistoryItemsList({
  section,
  tabLabel,
  basePath,
  noun,
  hint,
  addLabel,
  columns,
  rowLabel,
  prepareRows,
  canMove,
  disableNote = "",
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [movingId, setMovingId] = useState(null);

  const [statusTarget, setStatusTarget] = useState(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const { toast, showToast } = useToast();
  const cap = noun.charAt(0).toUpperCase() + noun.slice(1);

  const load = () => {
    setLoading(true);
    return api
      .adminGetHistoryItems(section)
      .then((data) => {
        setRows(data);
        setError("");
      })
      .catch((err) => setError(err.message || `The ${noun}s could not be loaded.`))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  const view = prepareRows ? prepareRows(rows) : rows;
  const movable =
    canMove ||
    ((row, all, dir) => {
      const i = all.findIndex((r) => r.id === row.id);
      return dir === "up" ? i > 0 : i < all.length - 1;
    });

  const move = async (row, direction) => {
    if (movingId) return;
    setMovingId(row.id);
    setError("");
    try {
      await api.adminReorderHistoryItem(section, row.id, direction);
      const data = await api.adminGetHistoryItems(section);
      setRows(data);
    } catch (err) {
      setError(err.message || "The order could not be changed. Please try again.");
    } finally {
      setMovingId(null);
    }
  };

  const confirmStatusChange = async () => {
    if (!statusTarget || statusBusy) return;
    setStatusBusy(true);
    setStatusError("");
    const nextActive = !statusTarget.is_active;
    try {
      await api.adminToggleHistoryItemStatus(section, statusTarget.id, nextActive);
      setStatusTarget(null);
      showToast(`${cap} ${nextActive ? "enabled" : "disabled"} successfully.`);
      load();
    } catch (err) {
      setStatusError(err.message || `The ${noun} could not be ${nextActive ? "enabled" : "disabled"}. Please try again.`);
    } finally {
      setStatusBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await api.adminDeleteHistoryItem(section, deleteTarget.id);
      setDeleteTarget(null);
      showToast(`${cap} deleted successfully.`);
      load();
    } catch (err) {
      // the server explains why (e.g. an org node that still has sub-nodes)
      setDeleteError(err.message || `The ${noun} could not be deleted. Please try again.`);
    } finally {
      setDeleting(false);
    }
  };

  const colSpan = columns.length + 3;

  return (
    <>
      <HistoryPageHeader crumbs={[{ label: tabLabel }]} />

      <div className="admin-list-toolbar">
        <p className="admin-form__hint" style={{ margin: 0 }}>
          {hint}
        </p>
        <Link to={`${basePath}/new`} className="btn btn-primary">
          {addLabel}
        </Link>
      </div>

      {error && <p className="contact-form__status contact-form__status--error">{error}</p>}

      <div className="admin-list-table-wrap">
        <table className="admin-list-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.header}>{c.header}</th>
              ))}
              <th>Status</th>
              <th>Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={colSpan} className="empty-state">
                  กำลังโหลด…
                </td>
              </tr>
            )}
            {!loading && view.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="empty-state">
                  Nothing here yet — click "{addLabel}" to create the first {noun}.
                </td>
              </tr>
            )}
            {view.map((row, i) => (
              <tr key={row.id} className={row.is_active ? "" : "history-row--disabled"}>
                {columns.map((c) => (
                  <td key={c.header}>{c.render(row, i)}</td>
                ))}
                <td>
                  <span
                    className={`admin-status-badge ${
                      row.is_active ? "admin-status-badge--active" : "admin-status-badge--inactive"
                    }`}
                  >
                    {row.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <div className="admin-sort-arrows">
                    <button
                      type="button"
                      onClick={() => move(row, "up")}
                      disabled={Boolean(movingId) || !movable(row, rows, "up")}
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(row, "down")}
                      disabled={Boolean(movingId) || !movable(row, rows, "down")}
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                  </div>
                </td>
                <td>
                  <div className="admin-row-actions">
                    <button
                      type="button"
                      className={`admin-status-dot ${row.is_active ? "is-active" : ""}`}
                      onClick={() => {
                        setStatusError("");
                        setStatusTarget(row);
                      }}
                      title={row.is_active ? "Currently shown — click to hide" : "Hidden — click to show"}
                    >
                      ✓
                    </button>
                    <Link
                      to={`${basePath}/${row.id}/edit`}
                      className="admin-icon-btn admin-icon-btn--edit"
                      title="Edit"
                    >
                      ✎
                    </Link>
                    <button
                      type="button"
                      className="admin-icon-btn admin-icon-btn--delete"
                      onClick={() => {
                        setDeleteError("");
                        setDeleteTarget(row);
                      }}
                      title="Delete"
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

      {statusTarget && (
        <ConfirmModal
          title={statusTarget.is_active ? `Disable ${cap}?` : `Enable ${cap}?`}
          message={`Are you sure you want to ${statusTarget.is_active ? "disable" : "enable"} this ${noun}?${
            statusTarget.is_active && disableNote ? ` ${disableNote}` : ""
          }`}
          detail={`${cap}: ${rowLabel(statusTarget)}`}
          confirmLabel="Confirm"
          variant="primary"
          busy={statusBusy}
          error={statusError}
          onCancel={() => setStatusTarget(null)}
          onConfirm={confirmStatusChange}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title={`Delete ${cap}?`}
          message={`Are you sure you want to delete this ${noun}? This action cannot be undone.`}
          detail={`${cap}: ${rowLabel(deleteTarget)}`}
          confirmLabel="Delete"
          variant="danger"
          busy={deleting}
          error={deleteError}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}

      {toast}
    </>
  );
}

// ------------------------------------------------------------------
// Add / Edit page
// ------------------------------------------------------------------

/**
 * State + handlers for one Add/Edit page.
 *
 *  section      API segment
 *  listPath     where "back" and a successful create return to
 *  noun         for messages
 *  emptyForm    initial form object (camelCase; both languages live in it, so
 *               switching the language dropdown never discards unsaved text)
 *  rowToForm    (dbRow) => form
 *  validate     (form) => null | { message, lang? } — lang flips the dropdown
 *               to the language that holds the missing field
 *  getPosition  optional (row, allRows) => { index, total } for the order control
 */
export function useHistoryItemForm({ section, listPath, noun, emptyForm, rowToForm, validate, getPosition }) {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [row, setRow] = useState(null);
  const [allRows, setAllRows] = useState([]);
  const [lang, setLang] = useState("th");
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null); // { created: boolean }

  useEffect(() => {
    setLoading(true);
    setLoadFailed(false);
    Promise.all([isEdit ? api.adminGetHistoryItem(section, id) : null, api.adminGetHistoryItems(section)])
      .then(([loaded, all]) => {
        if (loaded) {
          setRow(loaded);
          setForm(rowToForm(loaded));
        }
        setAllRows(all);
      })
      .catch((err) => {
        setLoadFailed(true);
        setError(err.message || `The ${noun} could not be loaded.`);
      })
      .finally(() => setLoading(false));
    // rowToForm is a stable module-level function in every page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, id, isEdit]);

  const set = (field) => (value) => {
    setSuccess(null);
    setForm((f) => ({ ...f, [field]: value }));
  };

  const position = (() => {
    if (!isEdit || !row) return null;
    if (getPosition) return getPosition(row, allRows);
    return { index: allRows.findIndex((r) => r.id === row.id), total: allRows.length };
  })();

  const move = async (direction) => {
    setError("");
    try {
      await api.adminReorderHistoryItem(section, id, direction);
      setAllRows(await api.adminGetHistoryItems(section));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    const problem = validate(form);
    if (problem) {
      if (problem.lang) setLang(problem.lang);
      return setError(problem.message);
    }
    setSaving(true);
    setError("");
    setSuccess(null);
    try {
      if (isEdit) {
        const updated = await api.adminUpdateHistoryItem(section, id, form);
        setRow(updated);
        setAllRows(await api.adminGetHistoryItems(section));
        setSuccess({ created: false });
      } else {
        await api.adminCreateHistoryItem(section, form);
        setSuccess({ created: true });
      }
    } catch (err) {
      setError(err.message || `The ${noun} could not be saved. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  const closeSuccess = () => {
    const created = success?.created;
    setSuccess(null);
    if (created) navigate(listPath); // new records: back to the list, like Industries
  };

  return {
    id, isEdit, form, set, lang, setLang, loading, loadFailed, saving, error, setError,
    allRows, position, move, handleSubmit,
    successModal: success ? <SuccessModal onClose={closeSuccess} /> : null,
  };
}

/** Page chrome shared by the three Add/Edit forms; the page supplies its field panels as children. */
export function HistoryFormShell({ ctl, tabLabel, itemLabel, listPath, statusText, missingTh = false, orderHint, children }) {
  const { isEdit, form, set, lang, setLang, loading, loadFailed, saving, error, position, move } = ctl;

  if (loading) return <p className="empty-state">กำลังโหลด…</p>;

  const crumbs = [{ label: tabLabel, to: listPath }, { label: `${isEdit ? "Edit" : "Add"} ${itemLabel}` }];

  if (loadFailed) {
    return (
      <>
        <HistoryPageHeader crumbs={crumbs} />
        <p className="contact-form__status contact-form__status--error">{error}</p>
        <Link to={listPath} className="btn">
          Back
        </Link>
      </>
    );
  }

  return (
    <>
      <HistoryPageHeader crumbs={crumbs} />

      <form className="admin-form" onSubmit={ctl.handleSubmit}>
        {error && <p className="contact-form__status contact-form__status--error">{error}</p>}

        {missingTh && (
          <p className="industry-translation-warning">
            Missing Thai translation — the site will show the English text until it's filled in.
          </p>
        )}

        <AdminEditLayout
          sidebar={
            <>
              <AdminLanguageSelect value={lang} onChange={setLang} label="Language" />
              <AdminStatusToggle checked={form.isActive} onChange={set("isActive")} label="Status" text={statusText} />
              <div className="panel admin-edit-sidebar__section">
                <span className="admin-edit-sidebar__label">
                  Display Order{position ? `: ${position.index + 1} of ${position.total}` : ""}
                </span>
                {isEdit ? (
                  <div className="admin-sort-arrows">
                    <button type="button" onClick={() => move("up")} disabled={!position || position.index === 0} aria-label="Move up">
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move("down")}
                      disabled={!position || position.index === position.total - 1}
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                  </div>
                ) : (
                  <span className="admin-form__hint">New items are added at the end — reorder after saving.</span>
                )}
                {orderHint && <span className="admin-form__hint">{orderHint}</span>}
              </div>
            </>
          }
        >
          <div className="admin-form">{children}</div>
        </AdminEditLayout>

        <div className="admin-form__submit-row">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <Link to={listPath} className="btn">
            Cancel / Back
          </Link>
        </div>
      </form>

      {ctl.successModal}
    </>
  );
}
