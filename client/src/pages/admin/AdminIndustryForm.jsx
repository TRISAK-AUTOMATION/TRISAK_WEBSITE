import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";
import ImageUploadField from "../../components/ImageUploadField.jsx";
import { useToast } from "../../components/AdminModal.jsx";

const emptyForm = {
  number: "",
  name: "",
  nameTh: "",
  imageUrl: "",
  overlayColor: "#0f2f5f",
  description: "",
  descriptionTh: "",
  exploreLink: "",
  isActive: true,
};

function rowToForm(row) {
  return {
    number: row.number || "",
    name: row.name || "",
    nameTh: row.name_th || "",
    imageUrl: row.image_url || "",
    overlayColor: row.overlay_color || "#0f2f5f",
    description: row.description || "",
    descriptionTh: row.description_th || "",
    exploreLink: row.explore_link || "",
    isActive: row.is_active ?? true,
  };
}

/**
 * Industries Slider — Add/Edit Slide, one slide per page (page-mode,
 * mirroring AdminProductForm's /admin/products/new and /:id/edit shell).
 * The management/list page (AdminIndustries.jsx) only ever links here —
 * it never renders this form inline.
 */
export default function AdminIndustryForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast, showToast } = useToast();

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  // Active editing language. Both languages live in the single `form` state,
  // so switching tabs never discards unsaved text in either language.
  const [lang, setLang] = useState("th");

  // Position among all slides, only needed to drive the Display Order
  // up/down controls — not applicable until the slide itself exists.
  const [position, setPosition] = useState(null); // { index, total }

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    Promise.all([api.adminGetIndustry(id), api.adminGetIndustries()])
      .then(([row, allRows]) => {
        setForm(rowToForm(row));
        const index = allRows.findIndex((r) => r.id === row.id);
        setPosition({ index, total: allRows.length });
      })
      .catch((err) => {
        setLoadFailed(true);
        setError(err.message || "The slide could not be loaded.");
      })
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = (field) => (value) => {
    setSuccess(false);
    setForm((f) => ({ ...f, [field]: value }));
  };

  const missingTh = !form.nameTh.trim() || !form.descriptionTh.trim();

  const handleReorder = async (direction) => {
    setError("");
    try {
      await api.adminReorderIndustry(id, direction);
      const allRows = await api.adminGetIndustries();
      const index = allRows.findIndex((r) => r.id === Number(id));
      setPosition({ index, total: allRows.length });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!form.name.trim()) {
      setLang("en"); // surface the missing required field
      return setError("Please enter the industry name (English).");
    }
    if (!isEdit && !form.imageUrl) return setError("Please upload a slide image before saving.");

    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      if (isEdit) {
        await api.adminUpdateIndustry(id, form);
        setSuccess(true); // Home/History convention: stay on the Edit page after saving
      } else {
        await api.adminCreateIndustry(form);
        showToast("Slide created successfully.");
        navigate("/admin/industries"); // back to the management page, per spec
      }
    } catch (err) {
      setError(err.message || "The slide could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="empty-state">กำลังโหลด…</p>;
  }

  return (
    <>
      <AdminBreadcrumb
        items={[
          { label: "Industries Slider", to: "/admin/industries" },
          { label: isEdit ? "Edit Slide" : "Add Slide" },
        ]}
      />

      {loadFailed ? (
        <p className="contact-form__status contact-form__status--error">{error}</p>
      ) : (
        <form className="admin-form" onSubmit={handleSubmit}>
          {error && <p className="contact-form__status contact-form__status--error">{error}</p>}
          {success && <p className="contact-form__status contact-form__status--ok">Saved successfully.</p>}

          {missingTh && (
            <p className="industry-translation-warning">
              Missing Thai translation — the site will show the English text until it's filled in.
            </p>
          )}

          <div className="admin-edit-tabbar">
            <div className="admin-edit-tabs">
              <button
                type="button"
                className={`admin-edit-tab ${lang === "th" ? "is-active" : ""}`}
                onClick={() => setLang("th")}
              >
                🇹🇭 ภาษาไทย
              </button>
              <button
                type="button"
                className={`admin-edit-tab ${lang === "en" ? "is-active" : ""}`}
                onClick={() => setLang("en")}
              >
                🇬🇧 English
              </button>
            </div>
          </div>

          <div className="admin-form__section panel">
            {lang === "th" ? (
              <>
                <h3>Thai (ไทย)</h3>
                <label className="contact-form__field">
                  <span>Industry Name (TH)</span>
                  <input value={form.nameTh} onChange={(e) => set("nameTh")(e.target.value)} placeholder="เช่น การบริการและที่พัก" />
                </label>
                <label className="contact-form__field" style={{ marginTop: 16 }}>
                  <span>Description (TH)</span>
                  <textarea
                    rows={4}
                    value={form.descriptionTh}
                    onChange={(e) => set("descriptionTh")(e.target.value)}
                    placeholder={"เอ็กซ์เพรส ฟู้ด กรุ๊ป\nปาล์มส์ ฟู้ด อินเตอร์เนชั่นแนล\nโรงแรม"}
                  />
                </label>
              </>
            ) : (
              <>
                <h3>English</h3>
                <label className="contact-form__field">
                  <span>Industry Name (EN)</span>
                  <input value={form.name} onChange={(e) => set("name")(e.target.value)} placeholder="e.g. Hospitality" />
                </label>
                <label className="contact-form__field" style={{ marginTop: 16 }}>
                  <span>Description (EN) — one highlight per line</span>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => set("description")(e.target.value)}
                    placeholder={"Express Food Group\nPalms Food International\nHotels"}
                  />
                </label>
              </>
            )}
          </div>

          <div className="admin-form__section panel">
            <h3>Slide Image</h3>
            <label className="contact-form__field">
              <span>Current image preview / Upload / Replace</span>
              <ImageUploadField value={form.imageUrl} onChange={set("imageUrl")} />
            </label>
          </div>

          <div className="admin-form__section panel">
            <h3>Slide Settings</h3>
            <div className="admin-form__row">
              <label className="contact-form__field">
                <span>Number</span>
                <input value={form.number} onChange={(e) => set("number")(e.target.value)} placeholder="e.g. 05" maxLength={10} />
              </label>
              <label className="contact-form__field">
                <span>Overlay Color</span>
                <div className="industry-color-field">
                  <input type="color" value={form.overlayColor} onChange={(e) => set("overlayColor")(e.target.value)} />
                  <input value={form.overlayColor} onChange={(e) => set("overlayColor")(e.target.value)} placeholder="#0f2f5f" />
                </div>
              </label>
            </div>
            <label className="contact-form__field" style={{ marginTop: 16 }}>
              <span>Explore More Link</span>
              <input value={form.exploreLink} onChange={(e) => set("exploreLink")(e.target.value)} placeholder="/products?category=..." />
            </label>

            <div className="industry-slide-panel__settings-row">
              <label className="admin-form__checkbox">
                <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive")(e.target.checked)} />
                Active (shown in the Home page slider)
              </label>

              <div className="industry-slide-panel__order">
                <span>Display Order{position ? `: ${position.index + 1} of ${position.total}` : ""}</span>
                {isEdit ? (
                  <div className="admin-sort-arrows">
                    <button type="button" onClick={() => handleReorder("up")} disabled={!position || position.index === 0} aria-label="Move up">
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReorder("down")}
                      disabled={!position || position.index === position.total - 1}
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                  </div>
                ) : (
                  <span className="admin-form__hint">New slides are added at the end — reorder after saving.</span>
                )}
              </div>
            </div>
          </div>

          <div className="admin-form__submit-row">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <Link to="/admin/industries" className="btn">
              Cancel / Back
            </Link>
          </div>
        </form>
      )}

      {toast}
    </>
  );
}
