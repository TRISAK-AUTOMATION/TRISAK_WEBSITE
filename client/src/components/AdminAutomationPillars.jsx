import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/client.js";
import { ConfirmModal, useToast } from "./AdminModal.jsx";
import ImageUploadField from "./ImageUploadField.jsx";
import ImagePositionField from "./ImagePositionField.jsx";
import FeatureIcon, { FEATURE_ICON_OPTIONS, isFeatureIconUrl } from "./featureIcons.jsx";
import { PillarCard } from "./SolutionPillars.jsx";

const FEATURE_SLOTS = 3;
const IMAGE_TYPES = "image/jpeg,image/png,image/webp";
const ICON_TYPES = "image/png,image/webp,image/svg+xml";

// ---- draft <-> API shape ---------------------------------------------------------
function cardToDraft(card) {
  const features = Array.from({ length: FEATURE_SLOTS }, (_, i) => ({
    label: card.features?.[i]?.label || "",
    labelTh: card.features?.[i]?.labelTh || "",
    icon: card.features?.[i]?.icon || "",
  }));
  return {
    number: card.number || "",
    title: card.title || "",
    titleTh: card.titleTh || "",
    description: card.description || "",
    descriptionTh: card.descriptionTh || "",
    features,
    imageUrl: card.imageUrl || "",
    imageAlt: card.imageAlt || "",
    imageAltTh: card.imageAltTh || "",
    imagePositionX: card.imagePositionX ?? 50,
    imagePositionY: card.imagePositionY ?? 50,
    linkUrl: card.linkUrl || "",
    isActive: card.isActive,
    sortOrder: card.sortOrder ?? "",
  };
}

// A blank card for the "Create Card" form: enabled, last in the order, linking to the Automation Solution page.
const blankCard = (nextOrder) => ({
  number: "",
  title: "",
  titleTh: "",
  description: "",
  descriptionTh: "",
  features: [],
  imageUrl: "",
  imageAlt: "",
  imageAltTh: "",
  imagePositionX: 50,
  imagePositionY: 50,
  linkUrl: "/automation-solution",
  isActive: true,
  sortOrder: nextOrder,
});

// What the public card component expects (empty feature slots dropped).
function draftToPillar(d) {
  return { ...d, features: d.features.filter((f) => f.label || f.labelTh || f.icon) };
}

// Mirrors the server's rules so mistakes are caught before the request is sent.
const isSafeUrl = (u) => /^\/(?![/\\])\S*$/.test(u) || /^https?:\/\/[^\s<>"']+$/i.test(u);
function validateDraft(d, maxOrder) {
  const e = {};
  if (!d.title.trim()) e.title = "Please enter the title (English).";
  if (!d.description.trim()) e.description = "Please enter the description (English).";
  if (d.sortOrder === "" || d.sortOrder == null) e.sortOrder = "Please enter the display order.";
  else if (!Number.isInteger(d.sortOrder) || d.sortOrder < 1 || d.sortOrder > maxOrder) {
    e.sortOrder = `Use a whole number from 1 to ${maxOrder}.`;
  }
  if (d.number.trim().length > 10) e.number = "Use 10 characters or fewer.";
  if (!d.linkUrl.trim()) e.linkUrl = "Please enter a link.";
  else if (!isSafeUrl(d.linkUrl.trim())) e.linkUrl = "Use a site path such as /automation-solution, or a full http(s):// address.";
  d.features.forEach((f, i) => {
    if ((f.labelTh.trim() || f.icon) && !f.label.trim()) e[`feature${i}`] = `Feature ${i + 1} needs a name in English.`;
  });
  return e;
}

// ---- small pieces ----------------------------------------------------------------
function FieldError({ children }) {
  return children ? <span className="pillar-admin__error">{children}</span> : null;
}

/** Choose a library icon or upload a custom one, for a single feature. */
function FeatureIconField({ index, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ICON_TYPES.split(",").includes(file.type)) return setError("Icons must be PNG, WebP or SVG.");
    if (file.size > 1024 * 1024) return setError("The icon is too large — maximum 1 MB.");
    setUploading(true);
    setError("");
    try {
      const { url } = await api.adminUploadImage(file);
      onChange(url);
      setOpen(false);
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="pillar-admin__icon-field">
      <div className="pillar-admin__icon-current">
        <span className="pillar-admin__icon-preview" title="Preview">
          <FeatureIcon icon={value} />
        </span>
        <span className="pillar-admin__icon-name">
          {isFeatureIconUrl(value)
            ? "Custom icon"
            : FEATURE_ICON_OPTIONS.find((o) => o.key === value)?.label || "No icon chosen"}
        </span>
        <button type="button" className="btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {open ? "Close" : "Choose icon"}
        </button>
        <label className={`btn ${uploading ? "is-uploading" : ""}`}>
          {uploading ? "Uploading…" : "Upload icon"}
          <input type="file" accept={ICON_TYPES} onChange={upload} disabled={uploading} hidden />
        </label>
        {value && (
          <button type="button" className="btn" onClick={() => onChange("")}>
            Clear
          </button>
        )}
      </div>
      {open && (
        <div className="icon-picker" role="radiogroup" aria-label={`Feature ${index + 1} icon`}>
          {FEATURE_ICON_OPTIONS.map((o) => (
            <button
              type="button"
              role="radio"
              aria-checked={value === o.key}
              key={o.key}
              className={`icon-picker__item${value === o.key ? " is-selected" : ""}`}
              onClick={() => {
                onChange(o.key);
                setOpen(false);
              }}
            >
              <FeatureIcon icon={o.key} className="icon-picker__svg" />
              <span>{o.label}</span>
            </button>
          ))}
        </div>
      )}
      {error && <p className="contact-form__status contact-form__status--error">{error}</p>}
    </div>
  );
}

/** The expanded editor for one card. Owns its own unsaved draft. */
function PillarEditor({ card, isNew = false, maxOrder, onSaved, onClose, onDirtyChange, showToast }) {
  const baseline = useMemo(() => cardToDraft(card), [card]);
  const [draft, setDraft] = useState(baseline);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [previewLang, setPreviewLang] = useState("en");

  // the row's quick enable/disable switch and the ↑/↓ arrows change the saved status / order; keep the form in step
  useEffect(() => {
    if (isNew) return;
    setDraft((d) => ({ ...d, isActive: card.isActive, sortOrder: card.sortOrder }));
  }, [isNew, card.isActive, card.sortOrder]);

  // once a save attempt has shown errors, re-check as the admin fixes things so stale messages clear
  useEffect(() => {
    setErrors((prev) => (Object.keys(prev).length ? validateDraft(draft, maxOrder) : prev));
  }, [draft, maxOrder]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);

  // tell the list whether there are unsaved edits, so it can ask before another card's editor replaces this one
  useEffect(() => {
    onDirtyChange?.(dirty);
    return () => onDirtyChange?.(false);
  }, [dirty, onDirtyChange]);
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const setFeature = (i, patch) =>
    setDraft((d) => ({ ...d, features: d.features.map((f, j) => (j === i ? { ...f, ...patch } : f)) }));

  const save = async () => {
    const found = validateDraft(draft, maxOrder);
    setErrors(found);
    if (Object.keys(found).length) {
      showToast("Please fix the highlighted fields before saving.", "error");
      return;
    }
    setSaving(true);
    try {
      const saved = isNew
        ? await api.adminCreateAutomationPillar(draft)
        : await api.adminUpdateAutomationPillar(card.id, draft);
      onSaved(saved);
      showToast(
        !isNew
          ? "Saved. The Home page now shows the latest content."
          : saved.isActive
            ? "Card created. It now appears on the Home page."
            : "Card created, but it is disabled — enable it to show it on the Home page."
      );
    } catch (err) {
      showToast(err.message || "The card could not be saved. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    if (dirty && !window.confirm("Discard your unsaved changes?")) return;
    onClose();
  };

  return (
    <div className="pillar-editor">
      <div className="pillar-editor__form">
        <div className="admin-form__row">
          <label className="contact-form__field">
            <span>Solution number (the label shown on the card)</span>
            <input value={draft.number} maxLength={10} placeholder="01" onChange={(e) => set({ number: e.target.value })} />
            <FieldError>{errors.number}</FieldError>
          </label>
          <label className="contact-form__field">
            <span>Display order (1 = first card)</span>
            <input
              type="number"
              min={1}
              max={maxOrder}
              step={1}
              value={draft.sortOrder}
              onChange={(e) => set({ sortOrder: e.target.value === "" ? "" : Number(e.target.value) })}
            />
            <FieldError>{errors.sortOrder}</FieldError>
          </label>
        </div>

        <div className="admin-form__row" style={{ marginTop: 20 }}>
          <label className="contact-form__field">
            <span>Display status</span>
            <span className="admin-toggle pillar-admin__status">
              <input type="checkbox" checked={draft.isActive} onChange={(e) => set({ isActive: e.target.checked })} />
              <span className="admin-toggle__track">
                <span className="admin-toggle__thumb" />
              </span>
              {draft.isActive ? "Enabled — shown on the Home page" : "Disabled — hidden from the Home page"}
            </span>
          </label>
        </div>

        <label className="contact-form__field" style={{ marginTop: 20 }}>
          <span>Link URL (where the card goes when clicked)</span>
          <input value={draft.linkUrl} placeholder="/automation-solution" onChange={(e) => set({ linkUrl: e.target.value })} />
          <FieldError>{errors.linkUrl}</FieldError>
        </label>

        <div className="pillar-editor__cols">
          {[
            { code: "en", flag: "🇬🇧 English", sfx: "", required: true },
            { code: "th", flag: "🇹🇭 ภาษาไทย", sfx: "Th", required: false },
          ].map(({ code, flag, sfx, required }) => (
            <div key={code} className="pillar-editor__col">
              <h4>
                {flag} {!required && <small>(blank = uses English)</small>}
              </h4>
              <label className="contact-form__field">
                <span>Title{required && " *"}</span>
                <input maxLength={100} value={draft[`title${sfx}`]} onChange={(e) => set({ [`title${sfx}`]: e.target.value })} />
                {required && <FieldError>{errors.title}</FieldError>}
              </label>
              <label className="contact-form__field">
                <span>Description{required && " *"}</span>
                <textarea
                  rows={3}
                  maxLength={400}
                  value={draft[`description${sfx}`]}
                  onChange={(e) => set({ [`description${sfx}`]: e.target.value })}
                />
                {required && <FieldError>{errors.description}</FieldError>}
              </label>
              {draft.features.map((f, i) => (
                <label className="contact-form__field" key={i}>
                  <span>Feature {i + 1}</span>
                  <input
                    maxLength={40}
                    value={f[`label${sfx}`]}
                    onChange={(e) => setFeature(i, { [`label${sfx}`]: e.target.value })}
                  />
                  {required && <FieldError>{errors[`feature${i}`]}</FieldError>}
                </label>
              ))}
              <label className="contact-form__field">
                <span>Image alt text</span>
                <input maxLength={200} value={draft[`imageAlt${sfx}`]} onChange={(e) => set({ [`imageAlt${sfx}`]: e.target.value })} />
              </label>
            </div>
          ))}
        </div>

        <h4 className="pillar-editor__heading">Feature icons</h4>
        <p className="admin-form__hint" style={{ marginTop: -4 }}>
          Pick an icon from the library, or upload your own (PNG, WebP or SVG up to 1 MB — one colour on a transparent background).
        </p>
        {draft.features.map((f, i) => (
          <div className="pillar-editor__icon-row" key={i}>
            <span className="pillar-editor__icon-label">Feature {i + 1}{f.label ? ` — ${f.label}` : ""}</span>
            <FeatureIconField index={i} value={f.icon} onChange={(icon) => setFeature(i, { icon })} />
          </div>
        ))}

        <h4 className="pillar-editor__heading">Main image</h4>
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
        <p className="admin-form__hint">JPG, PNG or WebP up to 5 MB. The picture is saved with the card when you press Save.</p>
      </div>

      <div className="pillar-editor__preview">
        <div className="pillar-editor__preview-head">
          <h4>Preview</h4>
          <div className="pillar-editor__lang" role="group" aria-label="Preview language">
            {["en", "th"].map((l) => (
              <button
                type="button"
                key={l}
                className={previewLang === l ? "is-active" : ""}
                onClick={() => setPreviewLang(l)}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="pillar-editor__preview-card solutions-section">
          <PillarCard pillar={draftToPillar(draft)} index={(Number(draft.sortOrder) || 1) - 1} lang={previewLang} preview />
        </div>
        <p className="admin-form__hint">Shows your unsaved changes exactly as the Home page will display them.</p>
      </div>

      <div className="admin-form__submit-row pillar-editor__actions">
        {dirty && <span className="pillar-editor__dirty">Unsaved changes</span>}
        <button type="button" className="btn admin-btn-cancel" onClick={cancel} disabled={saving}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary" onClick={save} disabled={saving || !dirty}>
          {saving ? "Saving…" : isNew ? "Create Card" : "Save"}
        </button>
      </div>
    </div>
  );
}

/**
 * "Automation Solutions Management" — shown on /admin/home. Lists the four
 * Home page cards; each opens into its own editor. Every save goes straight
 * to the database, and the public Home page reads from the same rows.
 */
export default function AdminAutomationPillars() {
  const [cards, setCards] = useState(null); // null = loading
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [creating, setCreating] = useState(null); // a blank card while the "Create Card" form is open
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const { toast, showToast } = useToast();
  const editorDirty = useRef(false); // does the open editor hold unsaved edits?
  const setEditorDirty = useCallback((dirty) => {
    editorDirty.current = dirty;
  }, []);

  // Only one editor (an existing card's, or the new-card form) is open at a time; replacing one that
  // holds unsaved edits asks first.
  const confirmLeaveEditor = () =>
    !((openId !== null || creating) && editorDirty.current) || window.confirm("Discard your unsaved changes?");

  // "Edit Card" opens that card's editor; pressing it again closes it.
  const toggleEditor = (card) => {
    if (!confirmLeaveEditor()) return;
    setCreating(null);
    setOpenId(openId === card.id ? null : card.id);
  };

  // "Create Card" opens an empty form, placed last by default.
  const openCreate = () => {
    if (!confirmLeaveEditor()) return;
    setOpenId(null);
    setCreating(blankCard((cards?.length || 0) + 1));
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await api.adminDeleteAutomationPillar(deleteTarget.id);
      if (openId === deleteTarget.id) setOpenId(null);
      setCards((list) => list.filter((c) => c.id !== deleteTarget.id));
      showToast(`"${deleteTarget.title}" was deleted and is no longer on the Home page.`);
      setDeleteTarget(null);
      load(); // the remaining cards were renumbered by the server
    } catch (err) {
      setDeleteError(err.message || "The card could not be deleted. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const load = () =>
    api
      .adminGetAutomationPillars()
      .then((rows) => {
        setCards(rows);
        setError("");
      })
      .catch((err) => setError(err.message || "The cards could not be loaded."));

  useEffect(() => {
    load();
  }, []);

  const replaceCard = (saved) => setCards((list) => list.map((c) => (c.id === saved.id ? saved : c)));

  const toggleStatus = async (card) => {
    setBusyId(card.id);
    try {
      replaceCard(await api.adminToggleAutomationPillarStatus(card.id, !card.isActive));
      showToast(card.isActive ? "Card disabled — hidden from the Home page." : "Card enabled — shown on the Home page.");
    } catch (err) {
      showToast(err.message || "The status could not be changed.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const move = async (card, direction) => {
    setBusyId(card.id);
    try {
      await api.adminReorderAutomationPillar(card.id, direction);
      await load();
      showToast("Order updated.");
    } catch (err) {
      showToast(err.message || "The order could not be changed.", "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="panel pillar-admin" id="automation-solutions-management">
      <div className="pillar-admin__head">
        <h2>Automation Solutions Management</h2>
        <button type="button" className="btn btn-primary" onClick={openCreate} disabled={!cards || !!creating}>
          + Create Card
        </button>
      </div>
      <p className="admin-form__hint">
        The cards of the Home page's "Automation Solutions" section. Press Create Card to add one, Edit Card to change a
        card's text, icons, picture, link and display order, or Delete to remove it. Use the switch to show/hide a card.
        Every change is saved to the database and appears on the Home page as soon as you press Save.
      </p>

      {error && <p className="contact-form__status contact-form__status--error">{error}</p>}
      {!cards && !error && <p className="empty-state">Loading…</p>}
      {cards && cards.length === 0 && (
        <p className="empty-state">
          No cards yet. Press <strong>Create Card</strong> to add one (the Home page hides this section while there are none).
          If the table is missing, apply <code>server/migrations/034_automation_pillars.sql</code> first.
        </p>
      )}

      {creating && (
        <div className="pillar-admin__card is-open">
          <div className="pillar-admin__row">
            <span className="pillar-admin__num">+</span>
            <div className="industry-row-names pillar-admin__names">
              <span>New card</span>
              <span className="industry-row-names__th">Fill in the form, then press Create Card</span>
            </div>
          </div>
          <PillarEditor
            isNew
            card={creating}
            maxOrder={(cards?.length || 0) + 1}
            showToast={showToast}
            onSaved={() => {
              setCreating(null);
              load();
            }}
            onDirtyChange={setEditorDirty}
            onClose={() => setCreating(null)}
          />
        </div>
      )}

      {cards?.map((card, i) => {
        const open = openId === card.id;
        return (
          <div className={`pillar-admin__card${open ? " is-open" : ""}${card.isActive ? "" : " is-disabled"}`} key={card.id}>
            <div className="pillar-admin__row">
              {card.imageUrl ? (
                <img src={card.imageUrl} alt="" className="admin-list-thumb" />
              ) : (
                <span className="admin-list-thumb admin-list-thumb--empty" />
              )}
              <span className="pillar-admin__num">{card.number || String(i + 1).padStart(2, "0")}</span>
              <div className="industry-row-names pillar-admin__names">
                <span>{card.title}</span>
                <span className="industry-row-names__th">{card.titleTh || "— no Thai title —"}</span>
              </div>
              <span className={`admin-status-badge ${card.isActive ? "admin-status-badge--active" : "admin-status-badge--inactive"}`}>
                {card.isActive ? "Enabled" : "Disabled"}
              </span>
              <label className="admin-toggle" title={card.isActive ? "Hide from the Home page" : "Show on the Home page"}>
                <input
                  type="checkbox"
                  checked={card.isActive}
                  disabled={busyId === card.id}
                  onChange={() => toggleStatus(card)}
                  aria-label={`${card.isActive ? "Disable" : "Enable"} ${card.title}`}
                />
                <span className="admin-toggle__track">
                  <span className="admin-toggle__thumb" />
                </span>
              </label>
              <div className="admin-row-actions">
                <button type="button" className="btn pillar-admin__arrow" disabled={i === 0 || busyId === card.id} onClick={() => move(card, "up")} title="Move up" aria-label={`Move ${card.title} up`}>
                  ↑
                </button>
                <button type="button" className="btn pillar-admin__arrow" disabled={i === cards.length - 1 || busyId === card.id} onClick={() => move(card, "down")} title="Move down" aria-label={`Move ${card.title} down`}>
                  ↓
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => toggleEditor(card)}
                  aria-expanded={open}
                  aria-label={`${open ? "Close editor" : "Edit Card"}: ${card.title}`}
                >
                  {open ? "Close" : "Edit Card"}
                </button>
                <button
                  type="button"
                  className="btn pillar-admin__delete"
                  disabled={busyId === card.id}
                  onClick={() => {
                    setDeleteError("");
                    setDeleteTarget(card);
                  }}
                  aria-label={`Delete card: ${card.title}`}
                >
                  Delete
                </button>
              </div>
            </div>
            {open && (
              <PillarEditor
                card={card}
                maxOrder={cards.length}
                showToast={showToast}
                onSaved={(saved) => {
                  replaceCard(saved);
                  load(); // a changed display order shifts the other cards
                }}
                onDirtyChange={setEditorDirty}
                onClose={() => setOpenId(null)}
              />
            )}
          </div>
        );
      })}
      {deleteTarget && (
        <ConfirmModal
          title="Delete card?"
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
    </section>
  );
}
