import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client.js";
import SuccessModal from "../../components/SuccessModal.jsx";
import ImageUploadField from "../../components/ImageUploadField.jsx";
import ImagePositionField from "../../components/ImagePositionField.jsx";
import { PillarCard } from "../../components/SolutionPillars.jsx";
import { AdminEditLayout, AdminLanguageSelect, AdminStatusToggle } from "../../components/AdminEditSidebar.jsx";
import { HomePageHeader, HOME_AUTOMATION_PATH } from "../../components/HomeAdmin.jsx";
import {
  FeatureIconField,
  FieldError,
  blankCard,
  cardToDraft,
  draftToPillar,
  validateDraft,
} from "../../components/AdminAutomationPillars.jsx";

const IMAGE_TYPES = "image/jpeg,image/png,image/webp";

/**
 * Home → Automation Solutions → Add / Edit card.
 * Same page structure as the History Add/Edit forms: language dropdown, status + display order in the sidebar, SuccessModal after saving.
 * Reads / writes the same automation-pillars API and fields as before.
 */
export default function AdminHomeAutomationForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [card, setCard] = useState(null);
  const [draft, setDraft] = useState(null);
  const [errors, setErrors] = useState({});
  const [lang, setLang] = useState("th");
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null); // { created: boolean }

  useEffect(() => {
    setLoading(true);
    setLoadFailed(false);
    api
      .adminGetAutomationPillars()
      .then((list) => {
        setRows(list);
        if (isEdit) {
          const found = list.find((c) => String(c.id) === String(id));
          if (!found) throw new Error("This card could not be found. It may have been deleted.");
          setCard(found);
          setDraft(cardToDraft(found));
        } else {
          // new cards go last; the 3 feature slots are available straight away
          setDraft(cardToDraft(blankCard(list.length + 1)));
        }
      })
      .catch((err) => {
        setLoadFailed(true);
        setError(err.message || "The card could not be loaded.");
      })
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const maxOrder = isEdit ? rows.length : rows.length + 1;
  const sfx = lang === "en" ? "" : "Th";
  const set = (patch) => {
    setSuccess(null);
    setDraft((d) => ({ ...d, ...patch }));
  };
  const setFeature = (i, patch) => {
    setSuccess(null);
    setDraft((d) => ({ ...d, features: d.features.map((f, j) => (j === i ? { ...f, ...patch } : f)) }));
  };

  // re-check as the admin fixes things so stale messages clear
  useEffect(() => {
    if (draft) setErrors((prev) => (Object.keys(prev).length ? validateDraft(draft, maxOrder) : prev));
  }, [draft, maxOrder]);

  const position = isEdit && card ? { index: rows.findIndex((r) => r.id === card.id), total: rows.length } : null;

  const move = async (direction) => {
    setError("");
    try {
      await api.adminReorderAutomationPillar(card.id, direction);
      const list = await api.adminGetAutomationPillars();
      setRows(list);
      const me = list.find((r) => r.id === card.id);
      if (me) {
        setCard(me);
        setDraft((d) => ({ ...d, sortOrder: me.sortOrder })); // keep the form in step so Save doesn't undo the move
      }
    } catch (err) {
      setError(err.message || "The order could not be changed. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    const found = validateDraft(draft, maxOrder);
    setErrors(found);
    const keys = Object.keys(found);
    if (keys.length) {
      // the required fields live in the English version — switch to it so the message is visible
      if (keys.some((k) => k === "title" || k === "description" || k.startsWith("feature"))) setLang("en");
      return setError("Please fix the highlighted fields before saving.");
    }
    setSaving(true);
    setError("");
    setSuccess(null);
    try {
      if (isEdit) {
        const saved = await api.adminUpdateAutomationPillar(card.id, draft);
        setCard(saved);
        setDraft(cardToDraft(saved));
        setRows(await api.adminGetAutomationPillars());
        setSuccess({ created: false });
      } else {
        await api.adminCreateAutomationPillar(draft);
        setSuccess({ created: true });
      }
    } catch (err) {
      setError(err.message || "The card could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const closeSuccess = () => {
    const created = success?.created;
    setSuccess(null);
    if (created) navigate(HOME_AUTOMATION_PATH); // new records: back to the list
  };

  const crumbs = [
    { label: "โซลูชันระบบอัตโนมัติ (Automation Solutions)", to: HOME_AUTOMATION_PATH },
    { label: isEdit ? "Edit Card" : "Add Card" },
  ];

  if (loading) return <p className="empty-state">กำลังโหลด…</p>;

  if (loadFailed) {
    return (
      <>
        <HomePageHeader crumbs={crumbs} />
        <p className="contact-form__status contact-form__status--error">{error}</p>
        <Link to={HOME_AUTOMATION_PATH} className="btn">
          Back
        </Link>
      </>
    );
  }

  const isEn = lang === "en";

  return (
    <>
      <HomePageHeader crumbs={crumbs} />

      <form className="admin-form" onSubmit={handleSubmit}>
        {error && <p className="contact-form__status contact-form__status--error">{error}</p>}

        {!draft.titleTh.trim() && (
          <p className="industry-translation-warning">
            Missing Thai translation — the site will show the English text until it's filled in.
          </p>
        )}

        <AdminEditLayout
          sidebar={
            <>
              <AdminLanguageSelect value={lang} onChange={setLang} label="Language" />
              <AdminStatusToggle
                checked={draft.isActive}
                onChange={(v) => set({ isActive: v })}
                label="Status"
                text={draft.isActive ? "Enabled — shown on the Home page" : "Disabled — hidden from the Home page"}
              />
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
                  <span className="admin-form__hint">New cards are added at the end — reorder after saving.</span>
                )}
              </div>
            </>
          }
        >
          <div className="admin-form">
            <div className="admin-form__section panel">
              <h3>ข้อมูลทั่วไป (ทุกภาษา)</h3>
              <div className="admin-form__row">
                <label className="contact-form__field">
                  <span>Solution number (the label shown on the card)</span>
                  <input value={draft.number} maxLength={10} placeholder="01" onChange={(e) => set({ number: e.target.value })} />
                  <FieldError>{errors.number}</FieldError>
                </label>
                <label className="contact-form__field">
                  <span>Link URL (where the card goes when clicked)</span>
                  <input value={draft.linkUrl} placeholder="/automation-solution" onChange={(e) => set({ linkUrl: e.target.value })} />
                  <FieldError>{errors.linkUrl}</FieldError>
                </label>
              </div>
            </div>

            <div className="admin-form__section panel">
              <h3>{isEn ? "เนื้อหา — English 🇬🇧" : "เนื้อหา — ภาษาไทย 🇹🇭"}</h3>
              {!isEn && <p className="admin-form__hint">Leave a Thai field blank to show the English text instead.</p>}
              <label className="contact-form__field">
                <span>Title{isEn && " *"}</span>
                <input maxLength={100} value={draft[`title${sfx}`]} onChange={(e) => set({ [`title${sfx}`]: e.target.value })} />
                {isEn && <FieldError>{errors.title}</FieldError>}
              </label>
              <label className="contact-form__field" style={{ marginTop: 20 }}>
                <span>Description{isEn && " *"}</span>
                <textarea
                  rows={3}
                  maxLength={400}
                  value={draft[`description${sfx}`]}
                  onChange={(e) => set({ [`description${sfx}`]: e.target.value })}
                />
                {isEn && <FieldError>{errors.description}</FieldError>}
              </label>
              {draft.features.map((f, i) => (
                <label className="contact-form__field" key={i} style={{ marginTop: 20 }}>
                  <span>Feature {i + 1}</span>
                  <input maxLength={40} value={f[`label${sfx}`]} onChange={(e) => setFeature(i, { [`label${sfx}`]: e.target.value })} />
                  {isEn && <FieldError>{errors[`feature${i}`]}</FieldError>}
                </label>
              ))}
              <label className="contact-form__field" style={{ marginTop: 20 }}>
                <span>Image alt text</span>
                <input maxLength={200} value={draft[`imageAlt${sfx}`]} onChange={(e) => set({ [`imageAlt${sfx}`]: e.target.value })} />
              </label>
            </div>

            <div className="admin-form__section panel">
              <h3>Feature icons</h3>
              <p className="admin-form__hint">
                Pick an icon from the library, or upload your own (PNG, WebP or SVG up to 1 MB — one colour on a transparent background).
              </p>
              {draft.features.map((f, i) => (
                <div className="pillar-editor__icon-row" key={i}>
                  <span className="pillar-editor__icon-label">
                    Feature {i + 1}
                    {f.label ? ` — ${f.label}` : ""}
                  </span>
                  <FeatureIconField index={i} value={f.icon} onChange={(icon) => setFeature(i, { icon })} />
                </div>
              ))}
            </div>

            <div className="admin-form__section panel">
              <h3>Main image</h3>
              {draft.imageUrl && (
                <div className="pillar-editor__position">
                  <ImagePositionField
                    imageUrl={draft.imageUrl}
                    positionX={draft.imagePositionX}
                    positionY={draft.imagePositionY}
                    aspectRatio={1}
                    onChange={({ x, y }) => set({ imagePositionX: x, imagePositionY: y })}
                  />
                </div>
              )}
              <ImageUploadField
                value={draft.imageUrl}
                hidePreview
                accept={IMAGE_TYPES}
                maxSizeMB={5}
                onChange={(url) => set({ imageUrl: url, imagePositionX: 50, imagePositionY: 50 })}
              />
              <p className="admin-form__hint">JPG, PNG or WebP up to 5 MB. The picture is saved with the card when you press Save Changes.</p>
            </div>

            <div className="admin-form__section panel">
              <h3>Preview ({isEn ? "EN" : "TH"})</h3>
              <div className="pillar-editor__preview-card solutions-section">
                <PillarCard pillar={draftToPillar(draft)} index={(Number(draft.sortOrder) || 1) - 1} lang={lang} preview />
              </div>
              <p className="admin-form__hint">Shows your unsaved changes as the Home page will display them.</p>
            </div>
          </div>
        </AdminEditLayout>

        <div className="admin-form__submit-row">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <Link to={HOME_AUTOMATION_PATH} className="btn">
            Cancel / Back
          </Link>
        </div>
      </form>

      {success && <SuccessModal onClose={closeSuccess} />}
    </>
  );
}
