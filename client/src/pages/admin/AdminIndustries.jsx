import { useEffect, useRef, useState } from "react";
import { api } from "../../api/client.js";
import AdminBreadcrumb from "../../components/AdminBreadcrumb.jsx";
import ImageUploadField from "../../components/ImageUploadField.jsx";
import { ConfirmModal, useToast } from "../../components/AdminModal.jsx";

let tempIdCounter = 0;
const nextTempId = () => `new-${++tempIdCounter}`;

function rowToSlide(row) {
  return {
    id: row.id,
    isNew: false,
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

function blankSlide() {
  return {
    id: nextTempId(),
    isNew: true,
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
}

function slideToPayload(slide) {
  const { id, isNew, ...payload } = slide;
  return payload;
}

function slideLabel(slide, index) {
  return slide.name.trim() || `Slide ${index + 1}`;
}

/** One slide's English / Thai / Image / Settings fields, inline — no modal. */
function SlidePanel({ slide, index, total, onChange, onDelete, onReorder }) {
  const set = (field) => (value) => onChange(slide.id, { [field]: value });
  const missingTh = !slide.nameTh.trim() || !slide.descriptionTh.trim();

  return (
    <div className="admin-form__section panel industry-slide-panel">
      <div className="industry-slide-panel__head">
        <h3>
          Slide {index + 1}
          {slide.number ? ` · #${slide.number}` : ""} — {slideLabel(slide, index)}
          {slide.isNew && <span className="industry-slide-panel__new-badge">New — not saved yet</span>}
        </h3>
        <button type="button" className="admin-icon-btn admin-icon-btn--delete" title="Delete Slide" onClick={() => onDelete(slide)}>
          🗑 Delete Slide
        </button>
      </div>

      {missingTh && (
        <p className="industry-translation-warning">
          Missing Thai translation — the site will show the English text until it's filled in.
        </p>
      )}

      <div className="admin-form__section-divider">English</div>
      <label className="contact-form__field">
        <span>Industry Name (EN)</span>
        <input value={slide.name} onChange={(e) => set("name")(e.target.value)} placeholder="e.g. Hospitality" />
      </label>
      <label className="contact-form__field" style={{ marginTop: 16 }}>
        <span>Description (EN) — one highlight per line</span>
        <textarea
          rows={3}
          value={slide.description}
          onChange={(e) => set("description")(e.target.value)}
          placeholder={"Express Food Group\nPalms Food International\nHotels"}
        />
      </label>

      <div className="admin-form__section-divider">Thai (ไทย)</div>
      <label className="contact-form__field">
        <span>Industry Name (TH)</span>
        <input value={slide.nameTh} onChange={(e) => set("nameTh")(e.target.value)} placeholder="เช่น การบริการและที่พัก" />
      </label>
      <label className="contact-form__field" style={{ marginTop: 16 }}>
        <span>Description (TH)</span>
        <textarea
          rows={3}
          value={slide.descriptionTh}
          onChange={(e) => set("descriptionTh")(e.target.value)}
          placeholder={"เอ็กซ์เพรส ฟู้ด กรุ๊ป\nปาล์มส์ ฟู้ด อินเตอร์เนชั่นแนล\nโรงแรม"}
        />
      </label>

      <div className="admin-form__section-divider">Slide Image</div>
      <label className="contact-form__field">
        <span>Current image preview / Upload / Replace</span>
        <ImageUploadField value={slide.imageUrl} onChange={set("imageUrl")} />
      </label>

      <div className="admin-form__section-divider">Slide Settings</div>
      <div className="admin-form__row">
        <label className="contact-form__field">
          <span>Number</span>
          <input value={slide.number} onChange={(e) => set("number")(e.target.value)} placeholder="e.g. 05" maxLength={10} />
        </label>
        <label className="contact-form__field">
          <span>Overlay Color</span>
          <div className="industry-color-field">
            <input type="color" value={slide.overlayColor} onChange={(e) => set("overlayColor")(e.target.value)} />
            <input value={slide.overlayColor} onChange={(e) => set("overlayColor")(e.target.value)} placeholder="#0f2f5f" />
          </div>
        </label>
      </div>
      <label className="contact-form__field" style={{ marginTop: 16 }}>
        <span>Explore More Link</span>
        <input value={slide.exploreLink} onChange={(e) => set("exploreLink")(e.target.value)} placeholder="/products?category=..." />
      </label>

      <div className="industry-slide-panel__settings-row">
        <label className="admin-form__checkbox">
          <input type="checkbox" checked={slide.isActive} onChange={(e) => set("isActive")(e.target.checked)} />
          Active (shown in the Home page slider)
        </label>

        <div className="industry-slide-panel__order">
          <span>Display Order</span>
          <div className="admin-sort-arrows">
            <button type="button" onClick={() => onReorder(slide.id, "up")} disabled={slide.isNew || index === 0} aria-label="Move up">
              ↑
            </button>
            <button
              type="button"
              onClick={() => onReorder(slide.id, "down")}
              disabled={slide.isNew || index === total - 1}
              aria-label="Move down"
            >
              ↓
            </button>
          </div>
          {slide.isNew && <span className="admin-form__hint">New slides are added at the end — save first to reorder.</span>}
        </div>
      </div>
    </div>
  );
}

function slideTargetLabel(target, slides) {
  const i = slides.findIndex((s) => s.id === target.id);
  return slideLabel(target, i === -1 ? 0 : i);
}

export default function AdminIndustries() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const { toast, showToast } = useToast();
  const addedSlideRef = useRef(null);

  const load = () =>
    api
      .adminGetIndustries()
      .then((rows) => {
        setSlides(rows.map(rowToSlide));
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateSlide = (id, patch) => {
    setSuccess(false);
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const addSlide = () => {
    setSuccess(false);
    const slide = blankSlide();
    setSlides((prev) => [...prev, slide]);
    // let the new panel mount before scrolling to it
    requestAnimationFrame(() => addedSlideRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };

  const handleDelete = (slide) => {
    setDeleteError("");
    setDeleteTarget(slide);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      // a never-saved slide only exists locally — just drop it, no API call
      if (!deleteTarget.isNew) await api.adminDeleteIndustry(deleteTarget.id);
      setSlides((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
      showToast("Slide deleted successfully.");
    } catch {
      setDeleteError("The slide could not be deleted. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleReorder = async (id, direction) => {
    setError("");
    try {
      await api.adminReorderIndustry(id, direction);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    for (let i = 0; i < slides.length; i++) {
      const s = slides[i];
      if (!s.name.trim()) {
        return setError(`${slideLabel(s, i)}: please enter the industry name (English).`);
      }
      if (s.isNew && !s.imageUrl) {
        return setError(`${slideLabel(s, i)}: please upload a slide image before saving.`);
      }
    }

    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      await Promise.all(
        slides.map((s) =>
          s.isNew ? api.adminCreateIndustry(slideToPayload(s)) : api.adminUpdateIndustry(s.id, slideToPayload(s))
        )
      );
      await load(); // pick up real ids for new slides, and the server's own state
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Some slides could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="empty-state">กำลังโหลด…</p>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <AdminBreadcrumb items={[{ label: "Industries Slider" }]} />

      <div className="admin-edit-tabbar">
        <div className="admin-edit-tabs">
          <span className="industry-page-heading">Industries Slider</span>
        </div>
        <div className="admin-edit-tabbar__actions">
          <button type="button" className="btn" onClick={addSlide}>
            + Add Slide
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            💾 {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {error && <p className="contact-form__status contact-form__status--error">{error}</p>}
      {success && <p className="contact-form__status contact-form__status--ok">Saved successfully.</p>}

      <div className="admin-edit-notice">
        🔔 Each slide shows its English and Thai content together below — editing one never changes the other.
        Add or edit slides, then click "Save Changes" to save everything at once. Deleting a slide happens
        immediately once confirmed.
      </div>

      <div className="admin-form">
        {slides.length === 0 && (
          <p className="empty-state">No slides yet — click "+ Add Slide" to create the first one.</p>
        )}

        {slides.map((slide, i) => (
          <div key={slide.id} ref={i === slides.length - 1 && slide.isNew ? addedSlideRef : null}>
            <SlidePanel
              slide={slide}
              index={i}
              total={slides.length}
              onChange={updateSlide}
              onDelete={handleDelete}
              onReorder={handleReorder}
            />
          </div>
        ))}

        <div className="admin-form__submit-row">
          <button type="button" className="btn" onClick={addSlide}>
            + Add Slide
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {deleteTarget && (
        <ConfirmModal
          title="Delete Slide?"
          message="Are you sure you want to delete this slide? This action cannot be undone."
          detail={slideTargetLabel(deleteTarget, slides)}
          busy={deleting}
          error={deleteError}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}

      {toast}
    </form>
  );
}
