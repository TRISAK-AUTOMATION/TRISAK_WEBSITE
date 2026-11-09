import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import { ConfirmModal, useToast } from "../../components/AdminModal.jsx";
import { HomePageHeader, HOME_AUTOMATION_PATH } from "../../components/HomeAdmin.jsx";

/**
 * Home → Automation Solutions Management.
 * Same list layout as the History lists (/admin/history/timeline …):
 * table with status, order arrows, enable / edit / delete actions, each
 * destructive action behind a ConfirmModal. Add / Edit open on their own page.
 * Uses the existing automation-pillars API — no data is copied or changed.
 */
export default function AdminHomeAutomation() {
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

  const load = () => {
    setLoading(true);
    return api
      .adminGetAutomationPillars()
      .then((data) => {
        setRows(data);
        setError("");
      })
      .catch((err) => setError(err.message || "The cards could not be loaded."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const move = async (row, direction) => {
    if (movingId) return;
    setMovingId(row.id);
    setError("");
    try {
      await api.adminReorderAutomationPillar(row.id, direction);
      setRows(await api.adminGetAutomationPillars());
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
    const nextActive = !statusTarget.isActive;
    try {
      await api.adminToggleAutomationPillarStatus(statusTarget.id, nextActive);
      setStatusTarget(null);
      showToast(`Card ${nextActive ? "enabled" : "disabled"} successfully.`);
      load();
    } catch (err) {
      setStatusError(err.message || `The card could not be ${nextActive ? "enabled" : "disabled"}. Please try again.`);
    } finally {
      setStatusBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await api.adminDeleteAutomationPillar(deleteTarget.id);
      setDeleteTarget(null);
      showToast("Card deleted successfully.");
      load(); // the server renumbers the remaining cards
    } catch (err) {
      setDeleteError(err.message || "The card could not be deleted. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const colSpan = 6;

  return (
    <>
      <HomePageHeader crumbs={[{ label: "โซลูชันระบบอัตโนมัติ (Automation Solutions)" }]} />

      <div className="admin-list-toolbar">
        <p className="admin-form__hint" style={{ margin: 0 }}>
          The cards of the Home page's "Automation Solutions" section, shown top to bottom in this order. Disabled cards are
          hidden from the public page.
        </p>
        <Link to={`${HOME_AUTOMATION_PATH}/new`} className="btn btn-primary">
          + Add Card
        </Link>
      </div>

      {error && <p className="contact-form__status contact-form__status--error">{error}</p>}

      <div className="admin-list-table-wrap">
        <table className="admin-list-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>No.</th>
              <th>Title (EN / TH)</th>
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
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="empty-state">
                  Nothing here yet — click "+ Add Card" to create the first card (the Home page hides this section while
                  there are none).
                </td>
              </tr>
            )}
            {rows.map((row, i) => (
              <tr key={row.id} className={row.isActive ? "" : "history-row--disabled"}>
                <td>
                  {row.imageUrl ? (
                    <img src={row.imageUrl} alt="" className="admin-list-thumb" />
                  ) : (
                    <span className="admin-list-thumb admin-list-thumb--empty" />
                  )}
                </td>
                <td>{row.number || String(i + 1).padStart(2, "0")}</td>
                <td>
                  <div className="industry-row-names">
                    <span>{row.title}</span>
                    <span className="industry-row-names__th">{row.titleTh || "— no Thai title —"}</span>
                  </div>
                </td>
                <td>
                  <span
                    className={`admin-status-badge ${
                      row.isActive ? "admin-status-badge--active" : "admin-status-badge--inactive"
                    }`}
                  >
                    {row.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <div className="admin-sort-arrows">
                    <button
                      type="button"
                      onClick={() => move(row, "up")}
                      disabled={Boolean(movingId) || i === 0}
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(row, "down")}
                      disabled={Boolean(movingId) || i === rows.length - 1}
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
                      className={`admin-status-dot ${row.isActive ? "is-active" : ""}`}
                      onClick={() => {
                        setStatusError("");
                        setStatusTarget(row);
                      }}
                      title={row.isActive ? "Currently shown — click to hide" : "Hidden — click to show"}
                    >
                      ✓
                    </button>
                    <Link
                      to={`${HOME_AUTOMATION_PATH}/${row.id}/edit`}
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
          title={statusTarget.isActive ? "Disable Card?" : "Enable Card?"}
          message={`Are you sure you want to ${statusTarget.isActive ? "disable" : "enable"} this card?${
            statusTarget.isActive ? " It will no longer appear on the Home page." : ""
          }`}
          detail={`Card: ${statusTarget.title}`}
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
          title="Delete Card?"
          message="Are you sure you want to delete this card? It will be removed from the database and from the Home page. This action cannot be undone."
          detail={`Card: ${deleteTarget.title}`}
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
