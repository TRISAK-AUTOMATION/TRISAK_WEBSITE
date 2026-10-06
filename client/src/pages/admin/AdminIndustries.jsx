import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";
import { ConfirmModal, useToast } from "../../components/AdminModal.jsx";

function industryLabel(ind) {
  return ind.name || "(untitled)";
}

/**
 * Industries Slider — management/list page. Shows every slide as a
 * compact row (thumbnail, names, status, order, actions) for overview and
 * navigation only; actual field-by-field editing happens on the dedicated
 * /admin/industries/:id/edit page (see AdminIndustryForm.jsx) — this page
 * never renders a slide's full edit form inline.
 */
export default function AdminIndustries() {
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusTarget, setStatusTarget] = useState(null); // industry being enabled/disabled
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const { toast, showToast } = useToast();

  const load = () => {
    setLoading(true);
    return api
      .adminGetIndustries()
      .then((rows) => {
        setIndustries(rows);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openStatusConfirm = (ind) => {
    setStatusError("");
    setStatusTarget(ind);
  };

  const confirmStatusChange = async () => {
    if (!statusTarget || statusBusy) return;
    setStatusBusy(true);
    setStatusError("");
    const nextActive = !statusTarget.is_active;
    try {
      await api.adminToggleIndustryStatus(statusTarget.id, nextActive);
      setStatusTarget(null);
      showToast(nextActive ? "Slide enabled successfully." : "Slide disabled successfully.");
      load();
    } catch {
      setStatusError(
        `The slide could not be ${nextActive ? "enabled" : "disabled"}. Please try again.`
      );
    } finally {
      setStatusBusy(false);
    }
  };

  const openDeleteConfirm = (ind) => {
    setDeleteError("");
    setDeleteTarget(ind);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await api.adminDeleteIndustry(deleteTarget.id);
      setDeleteTarget(null);
      showToast("Slide deleted successfully.");
      load();
    } catch {
      setDeleteError("The slide could not be deleted. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <AdminBreadcrumb items={[{ label: "Industries Slider" }]} />

      <div className="admin-list-toolbar">
        <p className="admin-form__hint" style={{ margin: 0 }}>
          Shown on the Home page's "Who We Serve" slider, in this order. Click Edit to change a slide's content.
        </p>
        <Link to="/admin/industries/new" className="btn btn-primary">
          + Add Slide
        </Link>
      </div>

      {error && <p className="contact-form__status contact-form__status--error">{error}</p>}

      <div className="admin-list-table-wrap">
        <table className="admin-list-table">
          <thead>
            <tr>
              <th>Preview</th>
              <th>Slide</th>
              <th>Industry (EN / TH)</th>
              <th>Status</th>
              <th>Order</th>
              <th>Actions</th>
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
            {!loading && industries.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-state">
                  No slides yet — click "+ Add Slide" to create the first one.
                </td>
              </tr>
            )}
            {industries.map((ind, i) => (
              <tr key={ind.id}>
                <td>
                  {ind.image_url ? (
                    <img src={ind.image_url} alt="" className="admin-list-thumb" />
                  ) : (
                    <span className="admin-list-thumb admin-list-thumb--empty" style={{ background: ind.overlay_color }} />
                  )}
                </td>
                <td className="admin-list-table__muted">Slide {String(i + 1).padStart(2, "0")}</td>
                <td>
                  <div className="industry-row-names">
                    <span>{industryLabel(ind)}</span>
                    <span className="industry-row-names__th">{ind.name_th || "— no Thai name —"}</span>
                  </div>
                </td>
                <td>
                  <span className={`admin-status-badge ${ind.is_active ? "admin-status-badge--active" : "admin-status-badge--inactive"}`}>
                    {ind.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="admin-list-table__muted">{i + 1}</td>
                <td>
                  <div className="admin-row-actions">
                    <button
                      type="button"
                      className={`admin-status-dot ${ind.is_active ? "is-active" : ""}`}
                      onClick={() => openStatusConfirm(ind)}
                      title={ind.is_active ? "Currently shown — click to hide" : "Hidden — click to show"}
                    >
                      ✓
                    </button>
                    <Link
                      to={`/admin/industries/${ind.id}/edit`}
                      className="admin-icon-btn admin-icon-btn--edit"
                      title="Edit"
                    >
                      ✎
                    </Link>
                    <button
                      type="button"
                      className="admin-icon-btn admin-icon-btn--delete"
                      onClick={() => openDeleteConfirm(ind)}
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
          title={statusTarget.is_active ? "Disable Slide?" : "Enable Slide?"}
          message={`Are you sure you want to ${statusTarget.is_active ? "disable" : "enable"} this slide?`}
          detail={`Slide: ${industryLabel(statusTarget)}`}
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
          title="Delete Slide?"
          message="Are you sure you want to delete this slide? This action cannot be undone."
          detail={`Slide: ${industryLabel(deleteTarget)}`}
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
