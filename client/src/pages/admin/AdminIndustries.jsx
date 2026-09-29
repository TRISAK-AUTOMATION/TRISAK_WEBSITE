import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";
import ImageUploadField from "../../components/ImageUploadField.jsx";
import AdminModal, { ConfirmModal, ModalButton, useToast } from "../../components/AdminModal.jsx";

const emptyForm = {
  number: "",
  name: "",
  imageUrl: "",
  overlayColor: "#0f2f5f",
  description: "",
  exploreLink: "",
  isActive: true,
};

function EditIndustryModal({ industry, onClose, onSaved }) {
  const isEdit = Boolean(industry);
  const [form, setForm] = useState(
    industry
      ? {
          number: industry.number || "",
          name: industry.name || "",
          imageUrl: industry.image_url || "",
          overlayColor: industry.overlay_color || "#0f2f5f",
          description: industry.description || "",
          exploreLink: industry.explore_link || "",
          isActive: industry.is_active ?? true,
        }
      : emptyForm
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!form.name.trim()) return setError("Please enter the industry name.");
    setSaving(true);
    setError("");
    try {
      const saved = isEdit
        ? await api.adminUpdateIndustry(industry.id, form)
        : await api.adminCreateIndustry(form);
      onSaved(saved, isEdit);
    } catch (err) {
      setError(err.message || "The industry could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const formId = "industry-edit-form";

  return (
    <AdminModal
      title={isEdit ? "Edit Industry" : "Add Industry"}
      size="md"
      onClose={onClose}
      busy={saving}
      error={error}
      footer={
        <>
          <ModalButton onClick={onClose} disabled={saving}>
            Cancel
          </ModalButton>
          <ModalButton type="submit" form={formId} variant="primary" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </ModalButton>
        </>
      }
    >
      <form id={formId} className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form__row">
          <label className="contact-form__field">
            <span>Number</span>
            <input
              value={form.number}
              onChange={(e) => set("number")(e.target.value)}
              placeholder="e.g. 05"
              maxLength={10}
            />
          </label>
          <label className="contact-form__field">
            <span>Name</span>
            <input value={form.name} onChange={(e) => set("name")(e.target.value)} placeholder="e.g. Hospitality" />
          </label>
        </div>

        <label className="contact-form__field">
          <span>Background Image</span>
          <ImageUploadField value={form.imageUrl} onChange={set("imageUrl")} />
        </label>

        <div className="admin-form__row">
          <label className="contact-form__field">
            <span>Overlay Color</span>
            <div className="industry-color-field">
              <input
                type="color"
                value={form.overlayColor}
                onChange={(e) => set("overlayColor")(e.target.value)}
              />
              <input
                value={form.overlayColor}
                onChange={(e) => set("overlayColor")(e.target.value)}
                placeholder="#0f2f5f"
              />
            </div>
          </label>
          <label className="contact-form__field">
            <span>Explore More Link</span>
            <input
              value={form.exploreLink}
              onChange={(e) => set("exploreLink")(e.target.value)}
              placeholder="/products?category=..."
            />
          </label>
        </div>

        <label className="contact-form__field">
          <span>Highlights (one per line)</span>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => set("description")(e.target.value)}
            placeholder={"Express Food Group\nPalms Food International\nHotels"}
          />
        </label>

        <label className="admin-form__checkbox">
          <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive")(e.target.checked)} />
          Active (shown in the Home page slider)
        </label>
      </form>
    </AdminModal>
  );
}

export default function AdminIndustries() {
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // null | industry object | {} for "new"
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

  const handleSaved = (saved, wasEdit) => {
    setEditing(null);
    showToast(wasEdit ? "Industry updated successfully." : "Industry added successfully.");
    load();
  };

  const handleToggleStatus = async (industry) => {
    setError("");
    try {
      await api.adminToggleIndustryStatus(industry.id, !industry.is_active);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReorder = async (id, direction) => {
    setError("");
    try {
      await api.adminReorderIndustry(id, direction);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = (industry) => {
    setDeleteError("");
    setDeleteTarget(industry);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await api.adminDeleteIndustry(deleteTarget.id);
      setDeleteTarget(null);
      showToast("Industry deleted successfully.");
      load();
    } catch {
      setDeleteError("The industry could not be deleted. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <AdminBreadcrumb items={[{ label: "Industries" }]} />

      <div className="admin-list-toolbar">
        <p className="admin-form__hint" style={{ margin: 0 }}>
          Shown on the Home page's "Who We Serve" slider, in this order.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => setEditing({})}>
          + Add Industry
        </button>
      </div>

      {error && <p className="contact-form__status contact-form__status--error">{error}</p>}

      <div className="admin-list-table-wrap">
        <table className="admin-list-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Image</th>
              <th>No.</th>
              <th>Name</th>
              <th>Status / Actions</th>
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
            {!loading && industries.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-state">
                  No industries yet — add one to populate the Home page slider.
                </td>
              </tr>
            )}
            {industries.map((ind, i) => (
              <tr key={ind.id}>
                <td>
                  <div className="admin-sort-arrows">
                    <button type="button" onClick={() => handleReorder(ind.id, "up")} disabled={i === 0} aria-label="Move up">
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReorder(ind.id, "down")}
                      disabled={i === industries.length - 1}
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                  </div>
                </td>
                <td>
                  {ind.image_url ? (
                    <img src={ind.image_url} alt="" className="admin-list-thumb" />
                  ) : (
                    <span className="admin-list-thumb admin-list-thumb--empty" style={{ background: ind.overlay_color }} />
                  )}
                </td>
                <td className="admin-list-table__muted">{ind.number || "—"}</td>
                <td>{ind.name}</td>
                <td>
                  <div className="admin-row-actions">
                    <button
                      type="button"
                      className={`admin-status-dot ${ind.is_active ? "is-active" : ""}`}
                      onClick={() => handleToggleStatus(ind)}
                      title={ind.is_active ? "Active — click to hide" : "Hidden — click to show"}
                    >
                      ✓
                    </button>
                    <button type="button" className="admin-icon-btn admin-icon-btn--edit" title="Edit" onClick={() => setEditing(ind)}>
                      ✎
                    </button>
                    <button
                      type="button"
                      className="admin-icon-btn admin-icon-btn--delete"
                      title="Delete"
                      onClick={() => handleDelete(ind)}
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

      {editing !== null && (
        <EditIndustryModal
          industry={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Industry?"
          message="Are you sure you want to delete this industry? This action cannot be undone."
          detail={deleteTarget.name}
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
